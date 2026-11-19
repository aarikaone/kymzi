export const COUNTRY_PEOPLE_TARGET=5;
export type CityArtId='tokyo'|'rio'|'london'|'seoul'|'mumbai'|'toronto';
const rows=[
 ['JP','Japan','🇯🇵','Asia','tokyo','Tokyo','TYO',320,55,'tokyo',['Luna','Haru','Yuki','Aoi','Ren']],
 ['BR','Brazil','🇧🇷','South America','rio','Rio','RIO',133,163,'rio',['Rio','Bia','Sol','Luca','Nico']],
 ['GB','United Kingdom','🇬🇧','Europe','london','London','LON',182,60,'london',['Ash','Ellis','Kit','Rowan','Charlie']],
 ['KR','South Korea','🇰🇷','Asia','seoul','Seoul','SEL',293,76,'seoul',['Kai','Jin','Ari','Min','Jae']],
 ['IN','India','🇮🇳','Asia','mumbai','Mumbai','BOM',249,109,'mumbai',['Noor','Ira','Dev','Tara','Aadi']],
 ['CA','Canada','🇨🇦','North America','toronto','Toronto','YTO',102,67,'toronto',['Mika','Alex','Casey','Sam','Quinn']],
 ['US','United States','🇺🇸','North America','new-york','New York','NYC',96,80,null,['River','Sky','Reese','Avery','Jules']],
 ['FR','France','🇫🇷','Europe','paris','Paris','PAR',187,68,null,['Camille','Lou','Sacha','Noa','Remy']],
 ['DE','Germany','🇩🇪','Europe','berlin','Berlin','BER',200,60,null,['Milo','Toni','Jona','Mikael','Emil']],
 ['IT','Italy','🇮🇹','Europe','rome','Rome','ROM',201,76,null,['Andrea','Vale','Elia','Gio','Arielle']],
 ['ES','Spain','🇪🇸','Europe','barcelona','Barcelona','BCN',177,77,null,['Alexis','Luz','Dani','Mar','Rafa']],
 ['PT','Portugal','🇵🇹','Europe','lisbon','Lisbon','LIS',167,80,null,['Tom','Lia','Gui','Lumi','Duarte']],
 ['NL','Netherlands','🇳🇱','Europe','amsterdam','Amsterdam','AMS',191,58,null,['Bo','Sage','Sem','Novi','Jip']],
 ['SE','Sweden','🇸🇪','Europe','stockholm','Stockholm','STO',210,43,null,['Lo','Eli','Alva','Nils','Siri']],
 ['NO','Norway','🇳🇴','Europe','oslo','Oslo','OSL',199,41,null,['Iben','Storm','Ola','Eira','Siv']],
 ['GR','Greece','🇬🇷','Europe','athens','Athens','ATH',213,80,null,['Alexi','Niki','Theo','Iris','Dimi']],
 ['AU','Australia','🇦🇺','Oceania','sydney','Sydney','SYD',315,166,null,['Indy','Billie','Remi','Flynn','Harper']],
 ['NZ','New Zealand','🇳🇿','Oceania','auckland','Auckland','AKL',337,184,null,['Frankie','Tui','Blair','Rory','Aro']],
 ['SG','Singapore','🇸🇬','Asia','singapore','Singapore','SIN',281,132,null,['Eden','Shan','Jia','Averyn','Zen']],
 ['TH','Thailand','🇹🇭','Asia','bangkok','Bangkok','BKK',279,112,null,['Pim','Beam','Fah','Win','Mint']],
 ['ID','Indonesia','🇮🇩','Asia','jakarta','Jakarta','JKT',293,144,null,['Putri','Raka','Dara','Bayu','Nala']],
 ['AE','United Arab Emirates','🇦🇪','Asia','dubai','Dubai','DXB',231,103,null,['Amal','Zain','Reem','Omar','Dana']],
 ['ZA','South Africa','🇿🇦','Africa','cape-town','Cape Town','CPT',204,169,null,['Lebo','Zola','Thando','Neo','Lindi']],
 ['KE','Kenya','🇰🇪','Africa','nairobi','Nairobi','NBO',224,133,null,['Imani','Amani','Kito','Zuri','Nia']],
 ['MX','Mexico','🇲🇽','North America','mexico-city','Mexico City','MEX',85,111,null,['Paz','Emi','Cruz','Neri','Valea']],
 ['AR','Argentina','🇦🇷','South America','buenos-aires','Buenos Aires','BUE',129,185,null,['Azul','Fran','Cami','Pili','Lolo']],
] as const;
const palette=[['#e2d9ff','#6750b4'],['#d8edd8','#397760'],['#f8dbd7','#a15c6c'],['#f6ddeb','#a05a85'],['#ffe2c6','#a5683e'],['#d6e8f5','#4f75a5']] as const;
export type CountryId=typeof rows[number][0];
export type DestinationCityId=typeof rows[number][4];
const zones=['Asia/Tokyo','America/Sao_Paulo','Europe/London','Asia/Seoul','Asia/Kolkata','America/Toronto','America/New_York','Europe/Paris','Europe/Berlin','Europe/Rome','Europe/Madrid','Europe/Lisbon','Europe/Amsterdam','Europe/Stockholm','Europe/Oslo','Europe/Athens','Australia/Sydney','Pacific/Auckland','Asia/Singapore','Asia/Bangkok','Asia/Jakarta','Asia/Dubai','Africa/Johannesburg','Africa/Nairobi','America/Mexico_City','America/Argentina/Buenos_Aires'];
export type Country={timeZone:string;id:CountryId;name:string;flag:string;continent:string;cityId:DestinationCityId;city:string;code:string;x:number;y:number;artId:CityArtId|null;names:readonly string[];color:string;ink:string;motif:string};
export const COUNTRIES:Country[]=rows.map((r,i)=>({timeZone:zones[i],id:r[0],name:r[1],flag:r[2],continent:r[3],cityId:r[4],city:r[5],code:r[6],x:r[7],y:r[8],artId:r[9],names:r[10],color:palette[i%6][0],ink:palette[i%6][1],motif:['✿','☀','✦','❋','✺','✳'][i%6]}));
export function countryById(id:unknown):Country|undefined{return COUNTRIES.find(c=>c.id===id);}
export function countryByName(name:unknown):Country|undefined{return COUNTRIES.find(c=>c.name===name);}
export function countryForCity(id:unknown):Country|undefined{return COUNTRIES.find(c=>c.cityId===id);}
export const PUBLIC_VENUES=[
 {id:'cafe',name:'Museum café',icon:'☕',detail:'Public indoor meeting place'},
 {id:'gallery',name:'Gallery lobby',icon:'🎨',detail:'Public indoor meeting place'},
 {id:'park',name:'Central park gate',icon:'🌳',detail:'Public outdoor meeting place'},
] as const;
export type VenueId=typeof PUBLIC_VENUES[number]['id'];
export function publicVenue(id:unknown){return PUBLIC_VENUES.find(v=>v.id===id);}
