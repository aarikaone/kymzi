import {createContext} from 'react';
/** Keep collection tabs out of the way while the city search is focused. */
export const PlacesSearchContext=createContext<(active:boolean)=>void>(()=>{});
