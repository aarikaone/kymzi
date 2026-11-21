import React from 'react';
import {act,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';

vi.mock('react-native',async()=>{
  const React=await import('react');
  const View=({children,onLayout,accessibilityRole,accessibilityLabel,accessibilityState}:any)=>{
    React.useEffect(()=>{onLayout?.({nativeEvent:{layout:{width:160,height:120}}});},[]);
    return React.createElement('div',{role:accessibilityRole,'aria-label':accessibilityLabel,'aria-busy':accessibilityState?.busy},children);
  };
  const Image=Object.assign(React.forwardRef(({source,onLoad,onError}:any,ref:any)=>React.createElement('img',{
    ref,alt:'',src:typeof source==='number'?`asset-${source}`:source?.uri,'data-testid':'bitmap',
    onLoad:()=>onLoad?.({nativeEvent:{}}),onError:()=>onError?.({nativeEvent:{error:'Failed'}}),
  })),{resolveAssetSource:()=>({width:160,height:120})});
  class Value{value:number;constructor(value:number){this.value=value;}setValue(value:number){this.value=value;}}
  return {View,Image,Text:({children}:any)=>React.createElement('span',{},children),
    Pressable:({children,onPress,accessibilityLabel}:any)=>React.createElement('button',{'aria-label':accessibilityLabel,onClick:onPress},children),
    ActivityIndicator:()=>React.createElement('span',{'data-testid':'image-spinner'}),
    StyleSheet:{create:(s:any)=>s,absoluteFillObject:{position:'absolute',inset:0},flatten:(s:any):any=>Array.isArray(s)?Object.assign({},...s.filter(Boolean).map((v:any)=>Array.isArray(v)?Object.assign({},...v):v)):s},
    AccessibilityInfo:{isReduceMotionEnabled:()=>Promise.resolve(false),addEventListener:()=>({remove:()=>{}})},
    Animated:{Value,View,timing:(value:any,options:any)=>({start:(callback:any)=>{value.setValue(options.toValue);callback?.({finished:true});},stop:()=>{}})},
  };
});

import {NativeImage} from '../../mobile/components/NativeImage';
import {cropImage,imageIdentity} from '../../mobile/components/image-loading';
beforeEach(()=>vi.useFakeTimers());
afterEach(()=>{vi.useRealTimers();});

it('shows a delayed image loader and clears it after the bitmap finishes loading',async()=>{
 const loaded=vi.fn();render(<NativeImage source={11001} accessibilityLabel="Tokyo illustration" onLoad={loaded}/>);
 expect(screen.getByRole('image',{name:'Tokyo illustration'}).getAttribute('aria-busy')).toBe('true');
 expect(screen.queryByTestId('image-spinner')).toBeNull();
 await act(async()=>{await vi.advanceTimersByTimeAsync(150);});expect(screen.getByTestId('image-spinner')).toBeTruthy();
 fireEvent.load(screen.getByTestId('bitmap'));expect(loaded).toHaveBeenCalledOnce();
 expect(screen.getByRole('image',{name:'Tokyo illustration'}).getAttribute('aria-busy')).toBe('false');expect(screen.queryByTestId('image-spinner')).toBeNull();
});
it('reopens a loaded image without flashing the placeholder and resets loading for a new source',()=>{
 const first=render(<NativeImage source={11002} accessibilityLabel="City"/>);fireEvent.load(screen.getByTestId('bitmap'));first.unmount();
 const next=render(<NativeImage source={11002} accessibilityLabel="City"/>);expect(screen.getByRole('image',{name:'City'}).getAttribute('aria-busy')).toBe('false');
 next.rerender(<NativeImage source={11003} accessibilityLabel="City"/>);expect(screen.getByRole('image',{name:'City'}).getAttribute('aria-busy')).toBe('true');
});
it('replaces a failed image with retry and recovers without leaving an endless spinner',()=>{
 const error=vi.fn();render(<NativeImage source={11004} accessibilityLabel="Roamie photo" onError={error}/>);fireEvent.error(screen.getByTestId('bitmap'));expect(error).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Retry image: Roamie photo'}));expect(screen.queryByRole('button',{name:/Retry/})).toBeNull();
 expect(screen.getByRole('image',{name:'Roamie photo'}).getAttribute('aria-busy')).toBe('true');fireEvent.load(screen.getByTestId('bitmap'));
 expect(screen.getByRole('image',{name:'Roamie photo'}).getAttribute('aria-busy')).toBe('false');
});
it('makes stalled requests retryable after a bounded wait',async()=>{
 render(<NativeImage source={11005} accessibilityLabel="A place"/>);
 await act(async()=>{await vi.advanceTimersByTimeAsync(20001);});
 expect(screen.getByRole('button',{name:'Retry image: A place'})).toBeTruthy();expect(screen.queryByTestId('image-spinner')).toBeNull();
});
it('keeps city and portrait atlas crops correct across card aspect ratios',()=>{
 const city={column:1,row:3,columns:2,rows:4,tileWidth:512,tileHeight:384};
 expect(cropImage(city,256,192)).toEqual({width:512,height:768,left:-256,top:-576});
 expect(cropImage({...city,row:0},120,120)).toEqual({width:320,height:480,left:-180,top:0});
 expect(cropImage({column:2,row:1,columns:4,rows:4,tileWidth:1,tileHeight:1},84,96)).toEqual({width:384,height:384,left:-198,top:-96});
 const photo='data:image/jpeg;base64,'+'a'.repeat(2000);expect(imageIdentity(photo).length).toBeLessThan(50);expect(imageIdentity(photo)).not.toBe(imageIdentity(photo+'b'));
});

it('keeps an explicit Perfect Day loader visible until this cached tile finishes loading',async()=>{
 const first=render(<NativeImage source={11006} accessibilityLabel="Day image"/>);fireEvent.load(screen.getByTestId('bitmap'));first.unmount();
 render(<NativeImage source={11006} showLoader loaderPosition="top" accessibilityLabel="Day image"/>);
 expect(screen.getByRole('image',{name:'Day image'}).getAttribute('aria-busy')).toBe('true');
 await act(async()=>{await Promise.resolve();});expect(screen.getByTestId('image-spinner')).toBeTruthy();
 fireEvent.load(screen.getByTestId('bitmap'));expect(screen.getByRole('image',{name:'Day image'}).getAttribute('aria-busy')).toBe('false');expect(screen.queryByTestId('image-spinner')).toBeNull();
});
