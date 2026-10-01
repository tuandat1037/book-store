// @vitest-environment happy-dom
import { describe, it } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { App } from '../App';

describe('smoke: render App', () => {
  it('renders homepage without crashing', async () => {
    (global as any).IS_REACT_ACT_ENVIRONMENT = true;
    if (!window.matchMedia) {
      (window as any).matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
    }
    if (typeof (global as any).localStorage === 'undefined') {
      const store: Record<string, string> = {};
      (global as any).localStorage = {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => { store[k] = String(v); },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { for (const k of Object.keys(store)) delete store[k]; }
      };
    }
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(<App />);
      await new Promise((r) => setTimeout(r, 1500));
    });
    console.log('RENDERED HTML LEN:', div.innerHTML.length);
    console.log('SNIPPET:', div.innerHTML.slice(0, 300));
    root.unmount();
  });
});
