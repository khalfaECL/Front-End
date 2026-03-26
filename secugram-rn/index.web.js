import React from 'react';
import { createRoot } from 'react-dom/client';
import WebApp from './src/web/WebApp';

createRoot(document.getElementById('app')).render(React.createElement(WebApp));
