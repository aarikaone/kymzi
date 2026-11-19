import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
Object.defineProperty(HTMLElement.prototype,'scrollTo',{value:vi.fn(),writable:true});
afterEach(()=>{cleanup();localStorage.clear();window.history.replaceState(null,'','/');});
