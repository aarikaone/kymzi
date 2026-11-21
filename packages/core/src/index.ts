import {COUNTRIES} from './countries.ts';
import { questionBank } from './questions.ts';
import type { AgeBand, AvatarId, DemoPeer, Match, Question } from './types.ts';
export type * from './types.ts';
export { questionBank };
export const AGE_BANDS:AgeBand[]=['10-12','13-15','16-17','18-20','21-24','25-30'];
export const AVATARS:{id:AvatarId;name:string;tag:string;color:string;family:string}[]=[
  {id:'cloud',name:'Cloud',tag:'Head in the clouds',color:'#e7e1fa',family:'Fuzzy'},
  {id:'orbit',name:'Orbit',tag:'A little out there',color:'#dfe7ff',family:'Cosmic'},
  {id:'sunny',name:'Sunny',tag:'Certified good energy',color:'#ffead8',family:'Cosmic'},
  {id:'sprout',name:'Sprout',tag:'Quietly iconic',color:'#e3f0da',family:'Critters'},
  {"id": "mochi", "name": "Mochi", "tag": "Soft landing", "color": "#CAB4EF", "family": "Fuzzy"},
  {"id": "comet", "name": "Comet", "tag": "Always taking off", "color": "#8EAFFF", "family": "Cosmic"},
  {"id": "pebble", "name": "Pebble", "tag": "Down for the detour", "color": "#9BD8CD", "family": "Oddballs"},
  {"id": "pip", "name": "Pip", "tag": "Small but everywhere", "color": "#AFE4C6", "family": "Critters"},
  {"id": "nova", "name": "Nova", "tag": "Bright ideas only", "color": "#BE9BF3", "family": "Critters"},
  {"id": "boba", "name": "Boba", "tag": "Bubble energy", "color": "#CDB0EF", "family": "Oddballs"},
  {"id": "taro", "name": "Taro", "tag": "Curious by nature", "color": "#BCA1E6", "family": "Critters"},
  {"id": "nimbus", "name": "Nimbus", "tag": "Cloud nine, always", "color": "#A5DFF2", "family": "Fuzzy"},
  {"id": "dune", "name": "Dune", "tag": "Take the scenic way", "color": "#F4BE9D", "family": "Oddballs"},
  {"id": "cove", "name": "Cove", "tag": "Ocean state of mind", "color": "#B0DFD5", "family": "Critters"},
  {"id": "astro", "name": "Astro", "tag": "Out of this world", "color": "#91ACF3", "family": "Cosmic"},
  {"id": "cosmo", "name": "Cosmo", "tag": "One big point of view", "color": "#BF98EE", "family": "Cosmic"},
  {"id": "pixel", "name": "Pixel", "tag": "Little moments, big mood", "color": "#A6C4EF", "family": "Oddballs"},
  {"id": "ziggy", "name": "Ziggy", "tag": "Good vibes on repeat", "color": "#D9A1D3", "family": "Fuzzy"},
  {"id": "miso", "name": "Miso", "tag": "Low-key explorer", "color": "#CCBBEB", "family": "Critters"},
  {"id": "kiko", "name": "Kiko", "tag": "Hop into something new", "color": "#ACA8EC", "family": "Critters"},
  {"id": "echo", "name": "Echo", "tag": "Same wavelength", "color": "#96D7DD", "family": "Cosmic"},
  {"id": "wisp", "name": "Wisp", "tag": "Quiet little magic", "color": "#D3C5EE", "family": "Cosmic"},
  {"id": "pogo", "name": "Pogo", "tag": "One more tiny adventure", "color": "#B39CDE", "family": "Critters"},
  {"id": "yuzu", "name": "Yuzu", "tag": "A little zest", "color": "#EEB49E", "family": "Oddballs"},
  {"id": "juniper", "name": "Juniper", "tag": "Go where you grow", "color": "#B0D8CA", "family": "Fuzzy"},
  {"id": "luma", "name": "Luma", "tag": "Follow the glow", "color": "#ECC7B8", "family": "Cosmic"},
  {"id": "basil", "name": "Basil", "tag": "Pond-side daydreams", "color": "#ABD3B8", "family": "Critters"},
  {"id": "nori", "name": "Nori", "tag": "Make a splash", "color": "#91CDD4", "family": "Critters"},
  {"id": "opal", "name": "Opal", "tag": "A rare little find", "color": "#C9B2EA", "family": "Cosmic"},
  {"id": "indigo", "name": "Indigo", "tag": "Midnight wanderer", "color": "#899DE0", "family": "Fuzzy"},
  {"id": "suki", "name": "Suki", "tag": "Stay a little curious", "color": "#D8ACDB", "family": "Critters"},
  {"id": "fenn", "name": "Fenn", "tag": "Ears open, world ready", "color": "#A1CDE3", "family": "Critters"},
  {"id": "otto", "name": "Otto", "tag": "Eight ways to explore", "color": "#C3A2E3", "family": "Critters"},
  {"id": "puddle", "name": "Puddle", "tag": "Just go with the flow", "color": "#A2C8EE", "family": "Oddballs"},
  {"id": "flint", "name": "Flint", "tag": "Solid travel buddy", "color": "#A3ACC7", "family": "Oddballs"},
  {"id": "halo", "name": "Halo", "tag": "Orbiting good things", "color": "#B2A6E3", "family": "Cosmic"},
  {"id": "loop", "name": "Loop", "tag": "Always another way", "color": "#C9A0D8", "family": "Fuzzy"},
  {"id": "bumble", "name": "Bumble", "tag": "Buzzing for the next stop", "color": "#E7D096", "family": "Critters"},
  {"id": "tizzy", "name": "Tizzy", "tag": "Tiny chaos, great company", "color": "#9CD9DA", "family": "Fuzzy"},
  {"id": "quill", "name": "Quill", "tag": "Soft on the inside", "color": "#B7A2D2", "family": "Critters"},
  {"id": "roo", "name": "Roo", "tag": "Pocket-sized adventure", "color": "#E8C0B0", "family": "Critters"},
  {"id": "zuzu", "name": "Zuzu", "tag": "A little legendary", "color": "#ACE0C9", "family": "Critters"},
  {"id": "mello", "name": "Mello", "tag": "Chill is a destination", "color": "#EDC4B2", "family": "Fuzzy"},
  {"id": "cleo", "name": "Cleo", "tag": "Curiosity looks good", "color": "#C3A4E1", "family": "Critters"},
];
export const DAILY_IDS=['K0001','K0101','K0301'];
export const dailyQuestions=DAILY_IDS.map(id=>questionBank.find(q=>q.id===id)!);
export const suggestions:Record<string,string[]>={K0001:['Popcorn','Noodles','Toast','Fries'],K0101:['Cat','Owl','Fox','Goose'],K0301:['Teleportation','Time travel','Flying','Super speed']};
export const SAMPLE_ANSWERS:Record<string,string>={K0001:'Popcorn',K0101:'Cat',K0301:'Teleportation'};
export function bandMinimum(band:AgeBand):number {return Number(band.split('-')[0]);}
export function eligibleQuestions(band:AgeBand):Question[]{return questionBank.filter(q=>q.min_age<=bandMinimum(band));}
const aliases:Record<string,string>={'french fries':'fries','french fry':'fries','cats':'cat','owls':'owl','foxes':'fox','teleport':'teleportation','teleporting':'teleportation','time travelling':'time travel','time traveling':'time travel'};
export function normalizeAnswer(answer:string):string {const s=answer.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g,' ').replace(/[.!?]+$/g,'');return aliases[s]??s;}
export function canMatch(a:AgeBand,b:AgeBand):boolean {return a!=='10-12'&&a===b;}
const peerTemplates:Omit<DemoPeer,'id'|'ageBand'>[]=[
  {name:'Luna',avatar:'cloud',country:'Japan',flag:'🇯🇵',bio:'Overthinking the playlist. Underthinking everything else.',answers:{K0001:'Popcorn',K0101:'Cat',K0301:'Teleportation'},bonus:'Space'},
  {name:'Rio',avatar:'sunny',country:'Brazil',flag:'🇧🇷',bio:'Professional snack finder. Amateur everything else.',answers:{K0001:'Noodles',K0101:'Cat',K0301:'Flying'},bonus:'Ocean'},
  {name:'Ash',avatar:'sprout',country:'United Kingdom',flag:'🇬🇧',bio:'Probably making a playlist for a very specific feeling.',answers:{K0001:'Popcorn',K0101:'Owl',K0301:'Teleportation'},bonus:'Space'},
  {name:'Kai',avatar:'orbit',country:'South Korea',flag:'🇰🇷',bio:'One more level. Then definitely going outside.',answers:{K0001:'Fries',K0101:'Fox',K0301:'Time travel'},bonus:'Ocean'},
  {name:'Noor',avatar:'cloud',country:'India',flag:'🇮🇳',bio:'Collecting tiny hobbies and very large ideas.',answers:{K0001:'Toast',K0101:'Goose',K0301:'Super speed'},bonus:'Space'},
  {name:'Mika',avatar:'sunny',country:'Canada',flag:'🇨🇦',bio:'Would absolutely befriend the alien.',answers:{K0001:'Noodles',K0101:'Owl',K0301:'Time travel'},bonus:'Ocean'},
];
const categoryDemoAnswers:Record<string,string[]>={"K0002":["Mango","Strawberry","Banana","Mango","Kiwi","Peach"],"K0003":["Chips","Popcorn","Chips","Toast","Noodles","Carrots"],"K0102":["Penguin","Owl","Goose","Cat","Goose","Owl"],"K0103":["Frog","Hamster","Fox","Frog","Squirrel","Cat"],"K0201":["Purple","Blue","Pink","Green","Purple","Orange"],"K0202":["Rain","Ocean","Birdsong","Rain","Wind","Ocean"],"K0203":["Sunflowers","Mint","Strawberries","Roses","Sunflowers","Basil"],"K0302":["Japan","Brazil","The beach","Space","Japan","Canada"],"K0303":["Snacks","Books","Snacks","Games","Art supplies","Water"],"K0501":["A galaxy","A forest","A dragon","A galaxy","Flowers","An ocean"],"K0502":["Clay","Paper","Yarn","Clay","Cardboard","Beads"],"K0503":["A spaceship","A castle","A robot","A spaceship","A tiny house","A theatre"],"K0601":["Uno","Mario Kart","Jenga","Uno","Charades","Monopoly"],"K0602":["A frog","A potato","A tiny duck","A frog","A sock","A cat"],"K0603":["Basketball","Football","Tennis","Basketball","Volleyball","Badminton"]};
const seededAnswers=(archetype:number)=>({...Object.fromEntries(Object.entries(categoryDemoAnswers).map(([id,answers])=>[id,answers[archetype%answers.length]])),...peerTemplates[archetype].answers});
export const demoPeers:DemoPeer[]=AGE_BANDS.filter(b=>b!=='10-12').flatMap(ageBand=>[
 ...peerTemplates.map((peer,i)=>({...peer,answers:seededAnswers(i),id:`${ageBand}-${i}`,ageBand})),
 ...COUNTRIES.flatMap((country,countryIndex)=>Array.from({length:5},(_,slot)=>({country,countryIndex,slot})).filter(x=>x.countryIndex>=6||x.slot!==0).map(({country,countryIndex,slot})=>({id:`${ageBand}-${country.id.toLowerCase()}-${slot}`,ageBand,name:country.names[slot],avatar:AVATARS[(countryIndex+slot)%4].id,country:country.name,flag:country.flag,bio:'Collecting little same-brain moments.',answers:seededAnswers((countryIndex+slot)%6),bonus:slot%2?'Ocean':'Space'}))),
]);
export function rankMatches(answers:Record<string,string>,band:AgeBand,ids:string[]=DAILY_IDS,blocked:string[]=[],rosterIds?:readonly string[]):Match[]{
  const answered=ids.filter(id=>normalizeAnswer(answers[id]??''));
  if(answered.length!==ids.length||!ids.length)return [];
  const roster=new Set(rosterIds??peerTemplates.map((_,i)=>`${band}-${i}`));
  return demoPeers.filter(peer=>canMatch(band,peer.ageBand)&&!blocked.includes(peer.id)&&roster.has(peer.id)).map(peer=>{
    const sharedIds=ids.filter(id=>!!peer.answers[id]&&normalizeAnswer(answers[id])===normalizeAnswer(peer.answers[id]));
    return {peer,shared:sharedIds.length,total:ids.length,score:Math.round(sharedIds.length/ids.length*100),sharedIds};
  }).filter(match=>match.shared>0).sort((a,b)=>b.shared-a.shared||a.peer.id.localeCompare(b.peer.id));
}
export function makePracticeRound(band:AgeBand,category='All themes'):Question[]{const pool=eligibleQuestions(band).filter(q=>category==='All themes'||q.category===category);const shuffled=[...pool];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}return shuffled.slice(0,3);}
export const themeSymbols=['🍿','🦊','🌿','🪄','🧸','🎨','🎲','🧭','📚','💭','🎧','💻','🫶','🧢','🚀','🎓','💼','🪴','☀️','✨'];
export const themes=[...new Set(questionBank.map(q=>q.category))].map((name,i)=>({name,symbol:themeSymbols[i],minAge:questionBank.find(q=>q.category===name)!.min_age}));

export * from './ideas.ts';
export * from './preview.ts';

export function matchingAnswerCount(answer:string,questionId:string,band:AgeBand,blocked:string[]=[],rosterIds?:readonly string[]):number { const clean=normalizeAnswer(answer);if(!clean)return 0;const roster=new Set(rosterIds??peerTemplates.map((_,i)=>`${band}-${i}`));return demoPeers.filter(p=>canMatch(band,p.ageBand)&&!blocked.includes(p.id)&&roster.has(p.id)&&normalizeAnswer(p.answers[questionId]??'')===clean).length; }

export * from './daily.ts';

export * from './categories.ts';

export * from './activity.ts';

export * from './passport.ts';

export * from './countries.ts';
export * from './encounters.ts';
export * from './social.ts';

export * from './attractions.ts';
export * from './exploration.ts';

export * from './artwork.ts';

export * from './surprise.ts';

export * from './demo-flow.ts';

export * from './visits.ts';
export * from './photos.ts';

export * from './pal-activity.ts';

export * from './journey-copy.ts';

export * from './pal-loop.ts';

export * from './profile-photo.ts';

export * from './profile-setup.ts';

export * from './launch.ts';

export * from './city-meetups.ts';

export * from './global-pals.ts';

export * from './home-visit-meet.ts';

export * from './favorites.ts';

export * from './place-categories.ts';
export * from './place-checkins.ts';

export * from './pal-dm.ts';

export * from './map-links.ts';
export * from './place-contributions.ts';

export * from './daily-place-leaderboard.ts';

export * from './app-features.ts';

export * from './travel-question-bank.ts';
export * from './question-library.ts';
export * from './perfect-day.ts';
export * from './receiver-preview.ts';
export * from './travel-profile.ts';
export * from './roamie-travel.ts';

export * from './place-swaps.ts';

export * from './place-pals.ts';

export * from './city-geography.ts';

export * from './world-catalogue.ts';
