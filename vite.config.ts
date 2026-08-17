import { defineConfig, type Plugin } from 'vite';

// The shipped jarvis-media-final.js is the single authority for media.
// Keeping a second network implementation inside the TypeScript transform caused
// duplicate provider calls, race conditions and slow CI when public indexes were down.
const mediaStub = `
async function setupMedia(){
  const state=document.querySelector<HTMLElement>('#mediaState');
  if(state) state.textContent='READY · IN-HOUSE VIDEO CORE';
}
`;

function mediaPlugin(): Plugin {
  return {
    name: 'jarvis-media-runtime-stub',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.ts')) return null;
      const start = code.indexOf('async function setupMedia(){');
      const end = code.indexOf('\nasync function setupSettings', start);
      if (start < 0 || end < 0) return null;
      return code.slice(0, start) + mediaStub + code.slice(end + 1);
    }
  };
}

export default defineConfig({ base: './', plugins: [mediaPlugin()] });
