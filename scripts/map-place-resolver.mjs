import {parseMapsPlaceLink,mapsURLAllowed} from '../packages/core/src/map-links.ts';
const clean=(s='')=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/<[^>]+>/g,'').trim();
export async function resolveMapsPlace(raw,{request=fetch}={}){
 let link=parseMapsPlaceLink(raw),current=link.url,html='',completed=false;
 for(let n=0;n<5;n++){
  if(!mapsURLAllowed(current))throw new Error('Maps redirected to an unsupported link.');
  const response=await request(current,{redirect:'manual',headers:{Accept:'text/html','User-Agent':'KymziPlacePreview/0.1'},signal:AbortSignal.timeout(12000)});
  if(response.status>=300&&response.status<400){const to=response.headers.get('location');if(!to)throw new Error('Could not open this Maps link.');current=new URL(to,current).toString();continue;}
  if(!response.ok)throw new Error('Could not open this Maps link.');
  // Read a bounded metadata prefix; never evaluate a map page's JavaScript.
  if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let length=0;try{while(length<200000){const r=await reader.read();if(r.done)break;chunks.push(r.value);length+=r.value.byteLength;}}finally{await reader.cancel();}html=Buffer.concat(chunks).toString('utf8').slice(0,200000);}else html=(await response.text()).slice(0,200000);
  link=parseMapsPlaceLink(current);completed=true;break;
 }
 if(!completed)throw new Error('This Maps link redirected too many times.');
 if(link.short&&current!==link.url)link=parseMapsPlaceLink(current);
 const meta=(name)=>{for(const tag of html.match(/<meta\b[^>]*>/gi)??[]){const key=tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1],value=tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];if(key===name&&value)return clean(value);}return '';};
 const title=meta('og:title')||clean(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]);
 const name=title.replace(/\s*[-–|]\s*(?:Google Maps|Apple Maps).*$/i,'').trim();
 return {maps:link,...(link.nameHint?{name:link.nameHint}:name&&!/^(Google Maps|Apple Maps)$/i.test(name)?{name:name.slice(0,80)}:{}),...(link.cityHint?{city:link.cityHint}:{}),...(link.countryHint?{country:link.countryHint}:{})};
}
