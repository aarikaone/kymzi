import './cloud-test-setup';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
Object.defineProperty(HTMLElement.prototype,'scrollTo',{value:vi.fn(),writable:true});
afterEach(()=>{cleanup();localStorage.clear();window.history.replaceState(null,'','/');});

Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(this:HTMLDialogElement){this.setAttribute('open','');}});
Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(this:HTMLDialogElement){this.removeAttribute('open');this.dispatchEvent(new Event('close'));}});
