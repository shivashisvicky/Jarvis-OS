import fs from 'node:fs';
import path from 'node:path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

type JarvisError = {
  test: string;
  file: string;
  status: string;
  expectedStatus: string;
  attempt: number;
  category: string;
  message: string;
  retryable: boolean;
  artifacts: string[];
};

const outputDir = path.resolve('test-results');
const outputFile = path.join(outputDir, 'JARVIS_ERROR_PLACEHOLDER.json');

function classify(message: string): { category: string; retryable: boolean } {
  const text = message.toLowerCase();
  if (text.includes('strict mode violation') || text.includes('resolved to 2 elements')) {
    return { category: 'SELECTOR_AMBIGUITY', retryable: false };
  }
  if (text.includes('new page') || text.includes('new browser page') || text.includes('left the jarvis shell')) {
    return { category: 'ARCHITECTURE_VIOLATION', retryable: false };
  }
  if (text.includes('timeout') || text.includes('not visible') || text.includes('waiting for')) {
    return { category: 'UI_TIMING', retryable: true };
  }
  if (text.includes('net::') || text.includes('network') || text.includes('fetch')) {
    return { category: 'NETWORK', retryable: true };
  }
  return { category: 'PRODUCT_OR_TEST_FAILURE', retryable: false };
}

export default class JarvisErrorReporter implements Reporter {
  private errors: JarvisError[] = [];

  onBegin() {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify({ run: { status: 'running' }, errors: [] }, null, 2));
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'passed' && result.retry === 0) return;
    if (!result.error) return;

    const message = result.error.message ?? String(result.error);
    const classification = classify(message);
    const artifacts = result.attachments.map((a) => a.path ?? a.name).filter(Boolean);

    this.errors.push({
      test: test.titlePath().join(' > '),
      file: test.location.file,
      status: result.status,
      expectedStatus: test.expectedStatus,
      attempt: result.retry + 1,
      category: classification.category,
      message,
      retryable: classification.retryable,
      artifacts
    });

    this.flush('running');
  }

  onEnd(result) {
    this.flush(result.status);
  }

  private flush(status: string) {
    fs.writeFileSync(outputFile, JSON.stringify({
      run: {
        status,
        generatedAt: new Date().toISOString(),
        totalErrors: this.errors.length,
        uniqueFailures: new Set(this.errors.map((e) => `${e.file}:${e.test}:${e.category}:${e.message}`)).size
      },
      errors: this.errors
    }, null, 2));
  }
}
