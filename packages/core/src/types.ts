export type AgeBand = '10-12' | '13-15' | '16-17' | '18-20' | '21-24' | '25-30';
export type AvatarId = 'cloud' | 'orbit' | 'sunny' | 'sprout' | 'mochi' | 'comet' | 'pebble' | 'pip' | 'nova' | 'boba' | 'taro' | 'nimbus' | 'dune' | 'cove' | 'astro' | 'cosmo' | 'pixel' | 'ziggy' | 'miso' | 'kiko' | 'echo' | 'wisp' | 'pogo' | 'yuzu' | 'juniper' | 'luma' | 'basil' | 'nori' | 'opal' | 'indigo' | 'suki' | 'fenn' | 'otto' | 'puddle' | 'flint' | 'halo' | 'loop' | 'bumble' | 'tizzy' | 'quill' | 'roo' | 'zuzu' | 'mello' | 'cleo';
export type QuestionChoice={id:string;label:string;artworkId:string};
export type Question = {choices?:QuestionChoice[];topicId?:string;familyId?:string;phase?:'start'|'wander'|'afterglow';id:string; category:string; min_age:number; max_age:number; answer_format:string; max_answer_characters:number; prompt:string; language:string; mode:string; publication_status:string};
export type ProfilePhoto = {image:string; uploadedAt:string; ageBand:AgeBand};
export type Profile = {username?:string;age13Confirmed?:boolean;avatarPhoto?:ProfilePhoto;travel?:import('./travel-profile.ts').TravelProfile;name:string; avatar:AvatarId; ageBand:AgeBand; photo?:ProfilePhoto; city?:string; country?:string};
export type DemoPeer = {id:string; username?:string; name:string; avatar:AvatarId; country:string; flag:string; ageBand:AgeBand; bio:string; answers:Record<string,string>; bonus:string};
export type Match = {peer:DemoPeer; shared:number; total:number; score:number; sharedIds:string[];simulated?:true};
