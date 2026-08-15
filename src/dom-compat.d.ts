// Jarvis OS DOM compatibility shim
//
// querySelector('#id') is typed as Element by TypeScript when the selector is
// a generic string. Jarvis only accesses `.style` on known HTML elements, but
// the selector result is not narrowed by the compiler. This declaration keeps
// the existing browser-native implementation type-safe without changing the
// runtime or adding a dependency.
declare global {
  interface Element {
    readonly style: CSSStyleDeclaration;
  }
}

export {};
