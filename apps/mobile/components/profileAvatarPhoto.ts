import * as ImagePicker from 'expo-image-picker';
import {ImageManipulator,SaveFormat} from 'expo-image-manipulator';
import {makeProfilePhoto,MAX_PROFILE_PHOTO_LENGTH,type AgeBand} from '@rymzi/core';
export async function pickProfileAvatarPhoto(band:AgeBand){
 const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:1,exif:false});if(result.canceled)return;
 const asset=result.assets[0];if(!asset?.width||!asset.height)throw new Error('Choose another photo.');if((asset.fileSize??0)>15*1024*1024)throw new Error('Choose a photo under 15 MB.');const side=Math.min(asset.width,asset.height),context=ImageManipulator.manipulate(asset.uri);context.crop({originX:(asset.width-side)/2,originY:(asset.height-side)/2,width:side,height:side});context.resize({width:384,height:384});
 let image='';try{const rendered=await context.renderAsync();try{for(const compress of [.82,.65,.45]){const out=await rendered.saveAsync({format:SaveFormat.JPEG,base64:true,compress});image='data:image/jpeg;base64,'+out.base64;if(image.length<=MAX_PROFILE_PHOTO_LENGTH)break;}}finally{rendered.release();}}finally{context.release();}return makeProfilePhoto(image,band);
}
