import {useEffect,useState} from 'react';
import {curatedTravelPlaces,loadTravelCityPlaces,type TravelCityId,type TravelPlace} from '@rymzi/core';
export function useCityPlaces(cityId:TravelCityId|null){
 const [attempt,setAttempt]=useState(0),[snapshot,setSnapshot]=useState<{id:TravelCityId|null;places:TravelPlace[];loading:boolean;error:string}>({id:cityId,places:cityId?curatedTravelPlaces(cityId):[],loading:!!cityId,error:''});
 useEffect(()=>{if(!cityId){setSnapshot({id:null,places:[],loading:false,error:''});return;}let alive=true;setSnapshot({id:cityId,places:curatedTravelPlaces(cityId),loading:true,error:''});loadTravelCityPlaces(cityId).then(places=>{if(alive)setSnapshot({id:cityId,places,loading:false,error:''});},()=>{if(alive)setSnapshot({id:cityId,places:curatedTravelPlaces(cityId),loading:false,error:'Places couldn’t load.'});});return()=>{alive=false;};},[cityId,attempt]);
 const current=snapshot.id===cityId?snapshot:{id:cityId,places:cityId?curatedTravelPlaces(cityId):[],loading:!!cityId,error:''};return {...current,retry:()=>setAttempt(n=>n+1)};
}
