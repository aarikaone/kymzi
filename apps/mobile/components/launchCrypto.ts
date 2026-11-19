import * as Crypto from 'expo-crypto';
import type {ChallengeCrypto} from '@rymzi/core';
export const nativeChallengeCrypto:ChallengeCrypto={
 nonce:()=>Array.from(Crypto.getRandomBytes(16),b=>b.toString(16).padStart(2,'0')).join(''),
 digest:value=>Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,value),
};
