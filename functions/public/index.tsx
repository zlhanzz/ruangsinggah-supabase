
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Helper to safely reload on chunk errors without infinite looping
const triggerSafeReloadOnChunkError = (reason: string) => {
  console.warn(`Chunk load error detected (${reason}). Checking cooldown before reloading...`);
  try {
    const lastReload = Number(sessionStorage.getItem('rs_last_chunk_reload') || 0);
    const now = Date.now();
    if (now - lastReload > 15000) {
      sessionStorage.setItem('rs_last_chunk_reload', String(now));
      window.location.reload();
    } else {
      console.warn('Chunk reload suppressed to prevent infinite reload loop.');
    }
  } catch {
    window.location.reload();
  }
};

// Global error handler to intercept Chunk Load Errors (caused by new deployments replacing old hashed files)
window.addEventListener('error', (e) => {
  const msg = e.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('ChunkLoadError')
  ) {
    triggerSafeReloadOnChunkError('window.error');
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('ChunkLoadError')
  ) {
    triggerSafeReloadOnChunkError('unhandledrejection');
  }
});


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
