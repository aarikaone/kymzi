import type {CSSProperties} from 'react';
import {publicCdnImage,type AvatarId} from '@rymzi/core';
import {CONNECTION_APPEARANCE,CONNECTION_AVATAR_SIZE,type ConnectionKind} from '../../../packages/shared/connectionAppearance';
import './connection-avatar.css';
export function ConnectionAvatar({avatar,kind,size=CONNECTION_AVATAR_SIZE,label}:{avatar:AvatarId;kind:ConnectionKind;size?:number;label?:string}){
 const colors=CONNECTION_APPEARANCE[kind];
 return <span className={'connection-avatar is-'+kind} data-relationship={kind} role={label?'img':undefined} aria-label={label} aria-hidden={!label||undefined} style={{'--connection-color':colors.color,'--connection-surface':colors.surface,width:size,height:size} as CSSProperties}><span><img src={publicCdnImage('/avatars/'+avatar+'.webp')} alt=""/></span></span>;
}
