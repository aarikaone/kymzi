import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({publicDir:"public-shell",plugins:[react()],build:{outDir:'../../dist',emptyOutDir:true},server:{proxy:{'/api/maps-place':'http://127.0.0.1:8788','/api/place-art':'http://127.0.0.1:8788','/api/place-location':'http://127.0.0.1:8788'},fs:{allow:['../..']}}});
