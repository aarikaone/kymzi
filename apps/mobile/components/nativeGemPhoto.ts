import * as ImagePicker from 'expo-image-picker';
import {ImageManipulator,SaveFormat} from 'expo-image-manipulator';
import {cleanCityJpeg,MAX_CITY_PHOTO_LENGTH} from '@rymzi/core';

export async function pickGemPhotoImages(limit:number,camera=false):Promise<string[]>{
 if(limit<1)return [];
 if(camera){const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted)throw new Error('Allow camera access, or choose a photo from your library.');}
 const result=camera?await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:1,exif:false}):await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:1,exif:false,allowsMultipleSelection:limit>1,selectionLimit:limit});
 if(result.canceled)return [];
 const images:string[]=[];
 for(const asset of result.assets.slice(0,limit)){
  if(!asset.width||!asset.height)throw new Error('Choose another photo.');
  if((asset.fileSize??0)>15*1024*1024)throw new Error('Choose a photo under 15 MB.');
  let image='';
  for(const size of [900,640,420]){
   const context=ImageManipulator.manipulate(asset.uri);context.resize(asset.width>asset.height?{width:Math.min(size,asset.width)}:{height:Math.min(size,asset.height)});
   try{const rendered=await context.renderAsync();try{for(const compress of [.75,.5,.3]){const out=await rendered.saveAsync({format:SaveFormat.JPEG,base64:true,compress});image='data:image/jpeg;base64,'+out.base64;if(image.length<=MAX_CITY_PHOTO_LENGTH)break;}}finally{rendered.release();}}finally{context.release();}
   if(image.length<=MAX_CITY_PHOTO_LENGTH)break;
  }
  if(image.length>MAX_CITY_PHOTO_LENGTH)throw new Error('Choose a smaller photo.');
  images.push(cleanCityJpeg(image));
 }
 return images;
}
