type StorageBackend={
  getItem:(key:string)=>Promise<string|null>;
  multiGet:(keys:readonly string[])=>Promise<readonly [string,string|null][]>;
  setItem:(key:string,value:string)=>Promise<void>;
  clear:()=>Promise<void>;
};

/** A closed app session can never write its old profile back after a reset. */
export function createLocalDataSession(backend:StorageBackend) {
  let active=true,pending=Promise.resolve(),reset:Promise<void>|undefined;
  const closed=()=>new Error('Local data was reset. Start again from Welcome.');
  return {
    getItem:(key:string)=>active?backend.getItem(key):Promise.reject(closed()),
    multiGet:(keys:readonly string[])=>active?backend.multiGet(keys):Promise.reject(closed()),
    setItem(key:string,value:string) {
      if(!active)return Promise.reject(closed());
      const write=pending.then(()=>{if(!active)throw closed();return backend.setItem(key,value);});
      pending=write.catch(()=>{});
      return write;
    },
    clear():Promise<void> {
      if(reset)return reset;
      if(!active)return Promise.resolve();
      active=false;
      reset=(async()=>{
        await pending;
        try{await backend.clear();}catch(error){active=true;throw error;}
        finally{reset=undefined;}
      })();
      return reset;
    },
  };
}
export type LocalDataSession=ReturnType<typeof createLocalDataSession>;
