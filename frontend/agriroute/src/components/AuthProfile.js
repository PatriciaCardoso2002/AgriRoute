import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    isAuthenticated && (
        <button className="btn btn-light d-flex align-items-center">
            <img
            src={user.picture}
            alt="User Profile"
            className="rounded-circle"
            style={{ width: "30px", height: "30px" }}
            />
        {/* <h2>{user.name}</h2>
        <p>{user.email}</p> */}
      </button>
    )
  );
};

export default Profile;