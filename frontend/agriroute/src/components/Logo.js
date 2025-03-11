import React from 'react';
import logoImage from "./../images/logo.png"; 
import './../styles/logo.css';

function Logo() {
  return (
    <div className="logo">
      <img src={logoImage} alt="AgriRoute Logo" />
    </div>
  );
}

export default Logo;
