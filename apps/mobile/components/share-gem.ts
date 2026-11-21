import {Alert,Share} from 'react-native';
import {gemShareCard,type PlaceDraft} from '@rymzi/core';
export async function shareGem(place:PlaceDraft){const card=gemShareCard(place);try{await Share.share({title:card.title,message:`${card.text}\n${card.url}`});}catch{Alert.alert('Couldn’t share this gem','Please try again.');}}
