import './app.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {CloudApp} from './CloudApp';
import './ui-polish.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><CloudApp/></React.StrictMode>);
