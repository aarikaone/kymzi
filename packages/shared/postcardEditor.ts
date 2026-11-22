export function localDateTime(iso:string){const date=new Date(iso);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
export function driftCountdown(ms:number){const total=Math.max(0,Math.ceil(ms/60000));return `${Math.floor(total/60)}h ${total%60}m`;}
export function driftDate(iso:string){return new Date(iso).toLocaleDateString('en',{month:'short',day:'numeric'});}
