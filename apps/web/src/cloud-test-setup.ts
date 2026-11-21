// Offline fixtures for UI tests only; production bootstraps from Firestore.
import '../../../scripts/catalogue-test-setup.ts';
import {CATALOGUE_CDN_ORIGIN,CLOUD_CATALOGUE_IMAGES,CLOUD_PUBLIC_IMAGES} from '../../../packages/core/src/catalogue/cloud-assets-data.ts';
import {configurePublicImages,registerCatalogueImages} from '@rymzi/core';
configurePublicImages(Object.fromEntries(Object.entries(CLOUD_PUBLIC_IMAGES).map(([key,image])=>[key,`${CATALOGUE_CDN_ORIGIN}/${image.path}`])));
registerCatalogueImages(Object.entries(CLOUD_CATALOGUE_IMAGES).map(([key,image])=>[key,{...image,url:`${CATALOGUE_CDN_ORIGIN}/${image.path}`} ]));
