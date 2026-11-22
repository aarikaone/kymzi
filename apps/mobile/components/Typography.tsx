import React,{createContext,useContext,type ReactNode} from 'react';
import {Text,type TextProps,type StyleProp,type TextStyle} from 'react-native';
export const HandFontContext=createContext(false);
export function Hand({children,style}:{children:ReactNode;style?:StyleProp<TextStyle>}){const ready=useContext(HandFontContext);return <Text style={[{fontFamily:ready?'Caveat':undefined,fontWeight:ready?'400':'500',fontSize:46,lineHeight:48,letterSpacing:0,color:'#F1F5EB'},style]}>{children}</Text>;}

/** Preserve each screen's original title font and size on a single line. */
export function PageHeading({children,style,...props}:TextProps){
 function inline(nodes:ReactNode):ReactNode{return React.Children.map(nodes,child=>{
  if(typeof child==='string')return child.replace(/\s*\n\s*/g,' ');
  if(!React.isValidElement(child))return child;
  if(child.type===React.Fragment||child.type===Text||child.type===Hand){const element=child as React.ReactElement<{children?:ReactNode}>;return React.cloneElement(element,{},inline(element.props.children));}
  return child;
 });}
 return <Text {...props} accessibilityRole="header" style={[{color:'#F1F5EB',minWidth:0,flexShrink:1},style]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.72} ellipsizeMode="tail">{inline(children)}</Text>;
}
