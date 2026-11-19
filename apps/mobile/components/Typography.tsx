import React,{createContext,useContext,type ReactNode} from 'react';
import {Text,type StyleProp,type TextStyle} from 'react-native';
export const HandFontContext=createContext(false);
export function Hand({children,style}:{children:ReactNode;style?:StyleProp<TextStyle>}){const ready=useContext(HandFontContext);return <Text style={[{fontFamily:ready?'Caveat':undefined,fontWeight:ready?'400':'500',fontSize:46,lineHeight:48,letterSpacing:0,color:'#F1F5EB'},style]}>{children}</Text>;}
