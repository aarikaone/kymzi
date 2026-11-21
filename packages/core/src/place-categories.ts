/** Small, original place characters. Shared SVG keeps all twenty crisp on both apps. */
export const PLACE_CATEGORIES = [
 {id:'mall',label:'Mall',color:'#C8BEFF',deep:'#7661CA',shape:'bag'},
 {id:'attraction',label:'Attraction',color:'#A9DAFF',deep:'#4189D6',shape:'castle'},
 {id:'cafe',label:'Café',color:'#F9C09A',deep:'#C77D57',shape:'cup'},
 {id:'restaurant',label:'Food spot',color:'#FFAFBD',deep:'#CE617B',shape:'bowl'},
 {id:'park',label:'Park',color:'#D5F88F',deep:'#77AA4B',shape:'tree'},
 {id:'beach',label:'Beach',color:'#FFE4A3',deep:'#D4A351',shape:'shell'},
 {id:'museum',label:'Museum',color:'#BAE9E5',deep:'#579C9A',shape:'museum'},
 {id:'landmark',label:'Landmark',color:'#C7C4FF',deep:'#7A73D3',shape:'tower'},
 {id:'viewpoint',label:'Viewpoint',color:'#B7D5FF',deep:'#6087CB',shape:'mountain'},
 {id:'street',label:'Street',color:'#F0D3FF',deep:'#A17EB9',shape:'sign'},
 {id:'market',label:'Market',color:'#FFCE9B',deep:'#C68E53',shape:'stall'},
 {id:'bookshop',label:'Bookshop',color:'#E5C6FF',deep:'#9770BC',shape:'book'},
 {id:'cinema',label:'Cinema',color:'#C8BEFF',deep:'#7464BA',shape:'clapper'},
 {id:'arcade',label:'Arcade',color:'#B9F0D6',deep:'#579B84',shape:'game'},
 {id:'sports',label:'Sports',color:'#FFC699',deep:'#C88853',shape:'ball'},
 {id:'trail',label:'Trail',color:'#D5EAA0',deep:'#92AA55',shape:'boot'},
 {id:'lake',label:'Lake',color:'#9FE2F7',deep:'#4199BF',shape:'drop'},
 {id:'garden',label:'Garden',color:'#FFBFD8',deep:'#CC7DA0',shape:'flower'},
 {id:'station',label:'Station',color:'#C7D8FF',deep:'#7A8EC4',shape:'train'},
 {id:'temple',label:'Temple',color:'#FFCCB4',deep:'#C78E79',shape:'pagoda'},
] as const;
export type PlaceCategoryId = typeof PLACE_CATEGORIES[number]['id'];
export function placeCategory(id:string){return PLACE_CATEGORIES.find(c=>c.id===id);}
const forms:Record<string,string>={
 bag:'<rect x="49" y="65" width="102" height="91" rx="24" fill="BODY"/><path d="M77 69V53a23 23 0 0146 0v16" fill="none" stroke="LIGHT" stroke-width="11" stroke-linecap="round"/><path d="M59 83h14" stroke="LIGHT" stroke-width="6" stroke-linecap="round"/>',
 castle:'<path d="M45 153V66h21V47h21v24h26V47h21v19h21v87Q100 175 45 153" fill="BODY"/><rect x="93" y="43" width="6" height="24" rx="3" fill="LIGHT"/><path d="M99 44l24 9-24 9" fill="#D5F88F"/>',
 cup:'<path d="M143 82h6c34 0 30 49-7 46" fill="none" stroke="LIGHT" stroke-width="15"/><path d="M43 75h106l-8 61q-5 23-44 23t-45-23Z" fill="BODY"/><ellipse cx="96" cy="75" rx="53" ry="14" fill="LIGHT"/><ellipse cx="96" cy="74" rx="41" ry="9" fill="#7C5346"/><path d="M75 50q-10-12 0-22m24 20q10-12 0-22" fill="none" stroke="LIGHT" stroke-width="7" stroke-linecap="round"/>',
 bowl:'<path d="M40 85h120q-3 72-60 72T40 85" fill="BODY"/><ellipse cx="100" cy="85" rx="60" ry="15" fill="LIGHT"/><ellipse cx="100" cy="83" rx="48" ry="9" fill="#8A5B53"/><path d="M123 85l30-53m-14 54l31-43" stroke="#FFE6A7" stroke-width="7" stroke-linecap="round"/>',
 tree:'<rect x="87" y="112" width="26" height="49" rx="12" fill="#9C7B64"/><path d="M48 117q-21-32 9-48 1-39 39-34 38-9 46 33 33 20 12 52-10 25-53 13-37 15-53-16" fill="BODY"/><path d="M66 64q6-16 22-16" fill="none" stroke="LIGHT" stroke-width="8" stroke-linecap="round"/>',
 shell:'<path d="M98 43q-34-25-48 11-38-1-29 37-15 32 25 41l40 26h28l40-26q40-9 25-41 9-38-29-37-14-36-48-11" fill="BODY"/><path d="M57 58l25 63m59-63-24 63M99 49v65" stroke="LIGHT" stroke-width="6" stroke-linecap="round"/>',
 museum:'<path d="M31 78l69-42 69 42Z" fill="BODY"/><rect x="38" y="80" width="124" height="11" rx="5" fill="LIGHT"/><path d="M48 91v52m34-52v52m36-52v52m34-52v52" stroke="BODY" stroke-width="18"/><rect x="32" y="143" width="136" height="19" rx="8" fill="BODY"/>',
 tower:'<path d="M95 25h10l5 35 20 54 29 47h-35l-24-33-24 33H41l29-47 20-54Z" fill="BODY"/><path d="M77 91h46M62 123h76M89 57h22" stroke="LIGHT" stroke-width="6" stroke-linecap="round"/>',
 mountain:'<path d="M24 149L79 47q10-18 22 0l20 39 12-24q8-13 17 1l39 86q4 12-12 12H39q-24 0-15-12" fill="BODY"/><path d="M59 84l20-37q10-18 22 0l20 39-24-9-17 13Z" fill="LIGHT"/><circle cx="147" cy="39" r="14" fill="#FFE3A1"/>',
 sign:'<rect x="91" y="41" width="18" height="124" rx="8" fill="#B4C7A0"/><path d="M38 48h111l24 26-24 25H38q-10 0-10-10V58q0-10 10-10" fill="BODY"/><path d="M50 111h110v41H50l-22-21Z" fill="LIGHT"/>',
 stall:'<rect x="43" y="86" width="114" height="72" rx="16" fill="BODY"/><path d="M43 48h114l17 39H26Z" fill="LIGHT"/><path d="M48 48l-6 38m38-38-2 38m38-38 2 38m34-38 6 38" stroke="BODY" stroke-width="15"/><rect x="55" y="138" width="90" height="10" rx="5" fill="LIGHT"/>',
 book:'<path d="M100 61q-30-29-67-11v95q35-12 67 11 32-23 67-11V50q-37-18-67 11" fill="BODY"/><path d="M100 62v94M47 64q20-6 36 6m36 0q16-12 34-6" fill="none" stroke="LIGHT" stroke-width="7" stroke-linecap="round"/><path d="M137 49v34l-9-7-9 7V52" fill="#D5F88F"/>',
 clapper:'<rect x="39" y="78" width="122" height="80" rx="20" fill="BODY"/><path d="M37 49l117-17 6 35L43 84Z" fill="LIGHT"/><path d="M56 46l20 29m14-34 19 29m15-34 19 28" stroke="BODY" stroke-width="12"/><rect x="56" y="139" width="88" height="6" rx="3" fill="LIGHT"/>',
 game:'<path d="M59 65h82q15 0 22 24l14 43q7 33-19 22l-30-21H72l-30 21q-26 11-19-22l14-43q7-24 22-24" fill="BODY"/><path d="M53 85v30m-15-15h30" stroke="LIGHT" stroke-width="9" stroke-linecap="round"/><circle cx="145" cy="93" r="6" fill="#C8BEFF"/><circle cx="158" cy="108" r="6" fill="#FFE4A3"/>',
 ball:'<circle cx="100" cy="98" r="62" fill="BODY"/><path d="M40 98h120M100 36v124M58 53q62 45 0 91m84-91q-62 45 0 91" fill="none" stroke="LIGHT" stroke-width="5"/>',
 boot:'<path d="M58 43h61v62l39 14q21 7 20 27-1 15-21 15H56q-14 0-14-14l4-83q0-21 12-21" fill="BODY"/><path d="M49 147h119M87 64h30m-30 19h30m-30 19h30" stroke="LIGHT" stroke-width="7" stroke-linecap="round"/><path d="M57 46v32" stroke="LIGHT" stroke-width="9" stroke-linecap="round"/>',
 drop:'<path d="M100 28q67 65 60 99-9 42-60 39-51 3-60-39-7-34 60-99" fill="BODY"/><path d="M68 89q-12 14-12 28" stroke="LIGHT" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M32 166q68 16 136 0" stroke="LIGHT" stroke-width="6" fill="none" stroke-linecap="round"/>',
 flower:'<path d="M99 153v27m0-7q-32 1-33-21 26-7 33 21m0-7q31 0 32-22-25-7-32 22" fill="#A7C979" stroke="#A7C979" stroke-width="6"/><path d="M100 43q27-32 42-1 35-5 31 27 28 24 0 44-1 36-34 29-28 32-45 2-35 7-33-27-29-22-2-45 0-36 34-28" fill="BODY"/><circle cx="100" cy="98" r="33" fill="#FFE1A0"/>',
 train:'<rect x="48" y="36" width="104" height="119" rx="31" fill="BODY"/><rect x="60" y="53" width="80" height="43" rx="12" fill="LIGHT"/><path d="M67 155l-10 16m76-16 10 16" stroke="LIGHT" stroke-width="9" stroke-linecap="round"/><circle cx="67" cy="135" r="7" fill="#FFE4A3"/><circle cx="133" cy="135" r="7" fill="#FFE4A3"/>',
 pagoda:'<path d="M55 91h90v67H55Z" fill="BODY"/><path d="M26 93q32-13 45-36h58q13 23 45 36Z" fill="LIGHT"/><path d="M44 57q35-12 56-38 21 26 56 38Z" fill="BODY"/><path d="M39 157h122" stroke="LIGHT" stroke-width="10" stroke-linecap="round"/>',
};
export function placeCategorySVG(id:PlaceCategoryId):string{
 const c=placeCategory(id)??PLACE_CATEGORIES[0],prefix=`pc-${c.id}`;
 const body=forms[c.shape].replaceAll('BODY',`url(#${prefix})`).replaceAll('LIGHT',c.color);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="${prefix}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.color}"/><stop offset="1" stop-color="${c.deep}"/></linearGradient></defs><ellipse cx="100" cy="178" rx="57" ry="9" fill="${c.deep}" opacity="0.2"/><ellipse cx="75" cy="169" rx="15" ry="10" fill="${c.deep}"/><ellipse cx="126" cy="169" rx="15" ry="10" fill="${c.deep}"/>${body}<ellipse cx="86" cy="113" rx="5.2" ry="7" fill="#222D27"/><ellipse cx="115" cy="113" rx="5.2" ry="7" fill="#222D27"/><circle cx="87.5" cy="110.5" r="1.6" fill="#FFFFFF"/><circle cx="116.5" cy="110.5" r="1.6" fill="#FFFFFF"/><path d="M94 126q7 7 14 0" fill="none" stroke="#222D27" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="74" cy="124" rx="7" ry="4" fill="#FFEDE2" opacity="0.45"/><ellipse cx="128" cy="124" rx="7" ry="4" fill="#FFEDE2" opacity="0.45"/><path d="M166 29v12m-6-6h12" stroke="${c.color}" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="130" r="3" fill="${c.color}" opacity="0.65"/></svg>`;
}
