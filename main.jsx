import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Show errors visibly instead of blank page
window.addEventListener('error', (e) => {
  document.getElementById('root').innerHTML =
    `<div style="background:#fff;padding:30px;font-family:monospace">
      <h2 style="color:red">❌ Error</h2>
      <p><b>${e.message}</b></p>
      <pre style="background:#f5f5f5;padding:10px;overflow:auto">${e.error?.stack||''}</pre>
     </div>`;
});

window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root').innerHTML =
    `<div style="background:#fff;padding:30px;font-family:monospace">
      <h2 style="color:red">❌ Promise Error</h2>
      <p><b>${e.reason}</b></p>
     </div>`;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
