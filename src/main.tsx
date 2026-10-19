import { createRoot } from 'react-dom/client';
import './index.css';
import { isFirebaseConfigured } from './lib/firebaseConfig';

const root = createRoot(document.getElementById('root')!);

if (isFirebaseConfigured) {
  // Load the app only when Firebase settings exist (otherwise Firebase throws on start).
  import('./App.tsx').then(({ default: App }) => root.render(<App />));
} else {
  root.render(
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#FBF7F1', color: '#1F1A17', fontFamily: 'Noto Sans, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Vivah Khata is almost ready</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#6B6058' }}>
          The Firebase settings are missing. Add <b>VITE_FIREBASE_API_KEY</b> and <b>VITE_FIREBASE_APP_ID</b> in
          Render → Environment, then redeploy.
        </p>
      </div>
    </div>
  );
}
