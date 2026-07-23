import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import { markAppLoaded } from './lib/chunkRecovery'
import { initGlobalErrorHandlers } from './lib/errorLogger'

initGlobalErrorHandlers()
markAppLoaded()

import('./firebase/config').then(({ perf }) => {
  if (perf) perf.dataCollectionEnabled = true
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
