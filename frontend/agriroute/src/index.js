import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    
    <Auth0Provider
      domain="dev-dsw46jjavhufmzfz.us.auth0.com"
      clientId="PWcR88DjWo6yO8bQ3I9rWAoViwUUqvUK"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <Router> {/* O Router envolve todo o App */}
        <App />
      </Router>
    </Auth0Provider>,
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

