import React from 'react';
import Svg,{Circle,G,Path} from 'react-native-svg';
// The original two-pal mark pairs with custom rounded vector lettering; no font load is required.
const GREEN_PATH="M13 25A15 15 0 0 1 28 10h4a15 15 0 0 1 15 15v13l23-23a13 13 0 0 1 18 18L51 70a17 17 0 0 1-12 5h-9L13 88V25Z",LAVENDER_PATH="m54 45 30 26a12 12 0 0 1-8 21H65L51 82H40a15 15 0 0 1-10-26l4-4a15 15 0 0 1 20-7Z";
const WORD_PATHS=["M119 21V75 M145 40L122 57 M123 56L147 75","M162 40L174 65Q179 76 186 62L197 40 M197 40L178 84Q173 95 164 92","M214 75V42 M214 52C214 35 237 35 237 52V75 M237 52C237 35 260 35 260 52V75","M280 41H310L280 74H312","M332 43V75"];
function PalMark(){return <><Path d={GREEN_PATH} fill="#D5F88F"/><Path d={LAVENDER_PATH} fill="#C8BEFF"/><G fill="#171624"><Circle cx={26} cy={30} r={3.5}/><Circle cx={36} cy={30} r={3.5}/><Circle cx={54} cy={68} r={3.5}/><Circle cx={64} cy={68} r={3.5}/></G></>;}
export function KymziSymbol({size=36}:{size?:number}){return <Svg width={size} height={size} viewBox="0 0 96 96" accessible={false}><PalMark/></Svg>;}
export {KymziSymbol as RymziSymbol};
export function Brand({dark=false}:{dark?:boolean}){return <Svg accessibilityRole="image" accessibilityLabel="Kymzi" width={347*.4} height={40} viewBox="0 0 347 100"><PalMark/>{WORD_PATHS.map((d,i)=><Path key={i} d={d} fill="none" stroke="#F1F5EB" strokeWidth={10.5} strokeLinecap="round" strokeLinejoin="round"/>)}<Circle cx={332} cy={23} r={6} fill="#C8BEFF"/></Svg>;}
