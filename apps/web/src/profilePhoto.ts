import {makeProfilePhoto,MAX_PROFILE_PHOTO_LENGTH,type AgeBand} from '@rymzi/core';
export async function prepareProfilePhoto(file:File,band:AgeBand){
 if(!/^image\/(jpeg|png|webp|avif|heic|heif)$/i.test(file.type))throw new Error('Choose a JPG, PNG, WebP or HEIC photo.');
 if(file.size>15*1024*1024)throw new Error('Choose a photo under 15 MB.');
 const url=URL.createObjectURL(file);
 try{
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image(),timeout=setTimeout(()=>{img.src='';reject(new Error('This photo could not be opened. Try a JPG or PNG.'));},15000);img.onload=()=>{clearTimeout(timeout);resolve(img);};img.onerror=()=>{clearTimeout(timeout);reject(new Error('This photo could not be opened. Try a JPG or PNG.'));};img.src=url;});
  const side=Math.min(image.naturalWidth,image.naturalHeight);if(!side)throw new Error('This photo could not be read.');
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=384;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Photo editing is unavailable. Try another browser.');
  ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,384,384);
  for(const quality of [.82,.65,.45]){const jpeg=canvas.toDataURL('image/jpeg',quality);if(jpeg.length<=MAX_PROFILE_PHOTO_LENGTH)return makeProfilePhoto(jpeg,band);}
  throw new Error('Choose a simpler or smaller photo.');
 }finally{URL.revokeObjectURL(url);}
}
