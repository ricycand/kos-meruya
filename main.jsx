import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Stable wrapper prevents React removeChild errors
const wrapper = document.createElement('div')
document.getElementById('root').appendChild(wrapper)
createRoot(wrapper).render(<App />)
