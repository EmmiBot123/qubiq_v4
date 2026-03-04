import React from 'react';
import { SlideProvider } from './context/Store';
import NovaRibbon from './components/NovaRibbon';
import Sidebar from './components/Sidebar';
import SlideCanvas from './components/SlideCanvas';
import ErrorBoundary from './components/ErrorBoundary';

import PresentationMode from './components/PresentationMode';

function App() {
  return (
    <ErrorBoundary>
      <SlideProvider>
        <PresentationMode />
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
          <NovaRibbon />
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Sidebar />
            <main style={{
              flex: 1,
              background: '#0c1221',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto'
            }}>
              <SlideCanvas />
            </main>
          </div>
        </div>
      </SlideProvider>
    </ErrorBoundary>
  );
}

export default App;
