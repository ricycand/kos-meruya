import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', (e) => {
  document.getElementById('root').innerHTML =
    '<div style="padding:20px;font-family:monospace;color:red"><h2>Error</h2><p>' +
    e.message + '</p><pre style="background:#f5f5f5;padding:10px;font-size:11px">' +
    (e.error?.stack||'') + '</pre></div>';
});
window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root').innerHTML =
    '<div style="padding:20px;font-family:monospace;color:red"><h2>Promise Error</h2><p>' +
    e.reason + '</p></div>';
});

createRoot(document.getElementById('root')).render(<App />)
