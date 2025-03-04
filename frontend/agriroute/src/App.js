import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Import components
import Home from './components/Home';
import Booking from './components/Booking';
import Payment from './components/Payment';
import Notification from './components/Notification';
import Logo from './components/Logo';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header custom-header p-4">
          <Logo /> {/* Use the Logo component here */}

          {/* Navigation Links */}
          <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <Link to="/" className="nav-link">Home</Link>
                </li>
                <li className="nav-item">
                  <Link to="/booking" className="nav-link">Booking</Link>
                </li>
                <li className="nav-item">
                  <Link to="/payment" className="nav-link">Payment</Link>
                </li>
                <li className="nav-item">
                  <Link to="/notification" className="nav-link">Notification</Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Routes */}
          <div className="container mt-5">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/notification" element={<Notification />} />
            </Routes>
          </div>
        </header>
      </div>
    </Router>
  );
}

export default App;
