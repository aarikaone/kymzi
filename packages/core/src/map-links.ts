export type MapsPlaceLink={url:string;identity:string;provider:'google'|'apple';nameHint?:string;cityHint?:string;countryHint?:string;short:boolean};
const googleHosts=new Set(['google.com','www.google.com','maps.google.com','google.co.in','www.google.co.in','maps.google.co.in','google.co.uk','www.google.co.uk']);
export function normalizedPlaceText(value:string){return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
export function mapsURLAllowed(value:string){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return false;return googleHosts.has(u.hostname)&&(u.pathname.startsWith('/maps')||u.hostname.startsWith('maps.'))||u.hostname==='maps.app.goo.gl'||u.hostname==='goo.gl'&&u.pathname.startsWith('/maps/')||u.hostname==='maps.apple.com'||u.hostname==='maps.apple';}catch{return false;}}
export function parseMapsPlaceLink(value:string):MapsPlaceLink{
 if(typeof value!=='string'||!value.trim()||value.length>6000)throw new Error('Paste a place link from Google Maps or Apple Maps.');
 const candidates=value.match(/https:\/\/[^\s<>"“”]+/g)??[],raw=candidates.map(v=>v.replace(/[),.;\]]+$/,'')).find(mapsURLAllowed);
 if(!raw)throw new Error('Use a Google Maps or Apple Maps place link.');
 const u=new URL(raw),provider=u.hostname.startsWith('maps.apple')?'apple':'google',short=u.hostname==='maps.app.goo.gl'||u.hostname==='goo.gl'||u.hostname==='maps.apple'&&u.pathname.startsWith('/p/');
 for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_')||['g_st','g_ep','entry','source','hl','lcs'].includes(key))u.searchParams.delete(key);
 u.hash='';u.searchParams.sort();
 const decode=(v:string)=>{try{return decodeURIComponent(v.replace(/\+/g,' '));}catch{return v;}};
 const pathName=u.pathname.match(/\/maps\/place\/([^/]+)/)?.[1];
 const query=provider==='apple'?(u.searchParams.get('name')??u.searchParams.get('q')):(u.searchParams.get('query')??u.searchParams.get('q'));
 const hint=(pathName?decode(pathName):query??'').trim();
 const before=value.slice(0,value.indexOf(raw)).replace(/\n+/g,' ').trim();
 const parts=hint.split(',').map(x=>x.trim()).filter(Boolean);
 const nameHint=(!/^[-+\d.]+\s*,\s*[-+\d.]+$/.test(hint)?parts[0]:'')||(before.length<100?before:'');
 const id=provider==='apple'?(u.searchParams.get('place-id')??u.searchParams.get('auid')):(u.searchParams.get('query_place_id')??u.searchParams.get('cid')??u.searchParams.get('ftid')??decode(u.pathname).match(/!1s([^!]+)/)?.[1]);
 if(!short&&!nameHint&&!id)throw new Error('Choose a named place or attraction in Maps, then share its link.');
 if(short&&u.pathname.length<3)throw new Error('Copy the full place link from Maps.');
 const identity=id?`${provider}:id:${id}`:short?`${provider}:short:${u.hostname}${u.pathname}`:`${provider}:place:${normalizedPlaceText(hint||nameHint)}:${u.searchParams.get('ll')??u.searchParams.get('coordinate')??''}`;
 return {url:u.toString(),identity,provider,short,...(nameHint?{nameHint:nameHint.slice(0,80)}:{}),...(parts.length>=3?{cityHint:parts.at(-2)!.slice(0,80),countryHint:parts.at(-1)!.slice(0,80)}:{})};
}
