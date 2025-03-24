import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FaSignOutAlt } from 'react-icons/fa'; // ícone de logout

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button
      className="btn btn-light rounded-circle"
      onClick={() => logout({ returnTo: window.location.origin })}
    >
      <FaSignOutAlt className="text-danger" />
    </button>
  );
};

export default LogoutButton;
