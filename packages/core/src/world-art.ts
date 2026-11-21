import {catalogueCdnImage} from './cdn.ts';
export type WorldArtKind='city'|'place';
export function worldArtKey(kind:WorldArtKind,id:string){return `${kind}/${id}`;}
export function worldArtAsset(kind:WorldArtKind,id:string){const image=catalogueCdnImage(kind,id);return image?{...image,cdnUrl:image.url}:undefined;}
