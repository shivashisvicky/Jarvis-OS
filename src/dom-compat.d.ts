// Jarvis OS DOM compatibility shim
//
// Keep generic Element queries type-safe for browser-native properties used by
// the existing UI. These declarations affect TypeScript only, not runtime.
declare global {
  interface Element {
    readonly style: CSSStyleDeclaration;
    readonly dataset: DOMStringMap;
  }
}

export {};
