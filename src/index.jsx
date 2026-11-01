import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { watchFrameFit } from './frameFit';
import { getSettings, subscribe } from './settings/store';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Corners of the frame by the size of the element (issue #47); idle until a level has limits.
watchFrameFit(getSettings, subscribe);
