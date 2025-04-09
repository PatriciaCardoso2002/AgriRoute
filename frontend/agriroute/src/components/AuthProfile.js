import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [telemovel, setTelemovel] = useState("");
  const [savedTelemovel, setSavedTelemovel] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("userPhone");
    if (stored) {
      setSavedTelemovel(stored);
      setTelemovel(stored); // preencher input para edição
    }
  }, []);

  const handleSave = () => {
    if (!telemovel.match(/^\+?[0-9]{9,15}$/)) {
      alert("Número inválido. Exemplo: +351912345678");
      return;
    }
    localStorage.setItem("userPhone", telemovel);
    setSavedTelemovel(telemovel);
    alert("✅ Telemóvel guardado com sucesso!");
  };

  if (isLoading) return <div>Loading ...</div>;

  return (
    isAuthenticated && (
      <div className="d-flex align-items-center flex-column mt-4">
        <button className="btn btn-light d-flex align-items-center mb-2">
          <img
            src={user.picture}
            alt="User Profile"
            className="rounded-circle"
            style={{ width: "30px", height: "30px" }}
          />
        </button>

        <div className="form-group w-100 px-3">
          <label>Telemóvel:</label>
          <input
            type="text"
            value={telemovel}
            onChange={(e) => setTelemovel(e.target.value)}
            className="form-control"
            placeholder="+351912345678"
          />
          <button className="btn btn-primary mt-2" onClick={handleSave}>
            Guardar Telemóvel
          </button>
          {savedTelemovel && (
            <p className="text-muted mt-2">
              Número atual guardado: <strong>{savedTelemovel}</strong>
            </p>
          )}
        </div>
      </div>
    )
  );
};

export default Profile;
