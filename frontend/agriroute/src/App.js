import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa'; // Import logout icon

// Import components
import Home from './components/Home';
import BookingConsumer from './components/BookingConsumer';
import BookingTransporter from './components/BookingTransporter';
import BookingProducer from './components/BookingProducer';
import Login from './components/Login';
import Logo from './components/Logo';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedLogin = localStorage.getItem("isLoggedIn");
    const storedRole = localStorage.getItem("userRole");
    if (storedLogin === "true" && storedRole) {
      setIsLoggedIn(true);
      setUserRole(storedRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUserRole("");
  };

  return (
    <Router>
      <div className="App">
      <header className="App-header custom-header p-4">
  {/* Navigation Bar */}
  <nav className="navbar navbar-expand-lg navbar-light bg-light">
    <div className="container">
      {/* Logo on the left side */}
      <div className="navbar-brand p-0">
        <Logo />
      </div>

      {/* Navbar Links */}
      <ul className="navbar-nav me-auto">
        <li className="nav-item">
          <Link to="/" className="nav-link">Home</Link>
        </li>

        {/* Show Booking Links Only If Logged In */}
        {isLoggedIn && userRole === "consumer" && (
          <li className="nav-item">
            <Link to="/bookingConsumer" className="nav-link">Booking Consumer</Link>
          </li>
        )}
        {isLoggedIn && userRole === "transporter" && (
          <li className="nav-item">
            <Link to="/bookingTransporter" className="nav-link">Booking Transporter</Link>
          </li>
        )}
        {isLoggedIn && userRole === "producer" && (
          <li className="nav-item">
            <Link to="/bookingProducer" className="nav-link">Booking Producer</Link>
          </li>
        )}
      </ul>

      {/* Show Login if Not Logged In, Logout if Logged In */}
      {isLoggedIn ? (
        <button className="btn btn-danger" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> Logout
        </button>
      ) : (
        <Link to="/login" className="nav-link text-success fs-5">
          <FaUser className="me-2" />
        </Link>
      )}
    </div>
  </nav>

  {/* Routes */}
  <div className="container mt-5">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bookingConsumer" element={<BookingConsumer />} />
      <Route path="/bookingTransporter" element={<BookingTransporter />} />
      <Route path="/bookingProducer" element={<BookingProducer />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  </div>
</header>
      </div>
    </Router>
  );
}

export default App;
