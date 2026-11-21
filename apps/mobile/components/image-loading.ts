export type ImageCrop = {column:number; row:number; columns:number; rows:number; tileWidth:number; tileHeight:number};

/** Keep large inline photos out of cache keys and React element keys. */
export function imageIdentity(value:string|number) {
  if(typeof value==='number')return `asset:${value}`;
  if(value.length<1024)return `uri:${value}`;
  let hash=2166136261;
  for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);
  return `inline:${value.length}:${hash>>>0}`;
}

/** Crop a sprite cell exactly like SVG xMidYMid slice, at any card aspect ratio. */
export function cropImage(crop:ImageCrop,width:number,height:number) {
  const scale=Math.max(width/crop.tileWidth,height/crop.tileHeight);
  return {width:crop.tileWidth*crop.columns*scale,height:crop.tileHeight*crop.rows*scale,
    left:-crop.column*crop.tileWidth*scale+(width-crop.tileWidth*scale)/2,
    top:-crop.row*crop.tileHeight*scale+(height-crop.tileHeight*scale)/2};
}

const loaded=new Set<string>();
export const imageWasLoaded=(key:string)=>loaded.has(key);
export function rememberLoadedImage(key:string) {
  loaded.delete(key);loaded.add(key);
  if(loaded.size>256)loaded.delete(loaded.values().next().value!);
}
export function forgetLoadedImage(key:string){loaded.delete(key);}

export function clearImageLoadingCache(){loaded.clear();}
