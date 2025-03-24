import React, { useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa'; // ícone para o botão de login

const LoginButton = () => {
  const { loginWithRedirect, user, isAuthenticated, isLoading, getIdTokenClaims } = useAuth0();
  const navigate = useNavigate();

  return (
    <button
      className="btn btn-light rounded-circle"
      onClick={() => loginWithRedirect()} // Inicia o login
    >
      <FaUser className="text-success" />
    </button>
  );
};

export default LoginButton;
