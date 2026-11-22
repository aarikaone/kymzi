export type GalleryPhoto={id:string;image:string};
export type PhotoGalleryProps={photos:readonly GalleryPhoto[];title:string;subtitle?:string;initialIndex?:number;onClose:()=>void;onIndexChange?:(index:number)=>void};
export function galleryIndex(index:number,total:number){return Math.max(0,Math.min(Math.max(0,total-1),Number.isFinite(index)?Math.trunc(index):0));}
