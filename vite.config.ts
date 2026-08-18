import { defineConfig } from 'vite';

function retireLegacyMediaRuntime() {
  return {
    name: 'jarvis-retire-legacy-media-runtime',
    transform(code: string, id: string) {
      if (!id.endsWith('/src/main.ts') || !code.includes('setupMedia')) return null;

      const withoutFunction = code.replace(
        /\nasync function setupMedia\(\)\{[\s\S]*?\n\}\n(?=\nasync function setupSettings)/,
        '\n',
      );
      const withoutCalls = withoutFunction
        .replace(/if\(active==='media'\)setupMedia\(\);/g, '')
        .replace(/if\(active==='media'\)await setupMedia\(\);/g, '');

      if (withoutCalls === code) return null;
      return { code: withoutCalls, map: null };
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [retireLegacyMediaRuntime()],
  build: {
    // Keep the legacy stylesheet unminified until its escaped-newline tail is retired.
    cssMinify: false,
  },
});
