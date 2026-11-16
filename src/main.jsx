import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const Router = import.meta.env.VITE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const tree = (
  <AuthProvider>
    <Router>
      <App />
    </Router>
    <Toaster theme="dark" position="bottom-right" richColors closeButton />
  </AuthProvider>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider> : tree}
  </React.StrictMode>
);
