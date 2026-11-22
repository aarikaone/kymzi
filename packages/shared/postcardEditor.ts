export function localDateTime(iso:string){const date=new Date(iso);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
export function driftCountdown(ms:number){const total=Math.max(0,Math.ceil(ms/60000));return `${Math.floor(total/60)}h ${total%60}m`;}
export function driftDate(iso:string){return new Date(iso).toLocaleDateString('en',{month:'short',day:'numeric'});}

export function driftTimer(ms:number){const total=Number.isFinite(ms)?Math.max(0,Math.ceil(ms/1000)):0,hours=Math.floor(total/3600),days=hours>24?Math.floor(hours/24):0,h=days?hours%24:hours;return {days,clock:[h,Math.floor(total%3600/60),total%60].map(n=>String(n).padStart(2,'0')).join(':')};}
