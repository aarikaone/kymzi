import {useMemo,useState} from 'react';
import {groupRoamieWishes,roamieWishStops,travelCityById,type PreviewState} from '@rymzi/core';
export function useWishStopFeed(state:PreviewState,cityFilter='all'){
 const [seed]=useState(()=>Math.floor(Math.random()*0x100000000)),groups=useMemo(()=>groupRoamieWishes(roamieWishStops(state),seed),[state,seed]);
 return groups.filter(group=>cityFilter==='all'||travelCityById(group.cityId)?.city===cityFilter).slice(0,5);
}
