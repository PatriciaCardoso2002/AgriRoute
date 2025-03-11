import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  // Fake user data
  const users = {
    consumer: { username: "consumer", password: "1234", role: "consumer" },
    transporter: { username: "transporter", password: "1234", role: "transporter" },
    producer: { username: "producer", password: "1234", role: "producer" },
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const { username, password } = credentials;
    const user = Object.values(users).find((u) => u.username === username && u.password === password);

    if (user) {
      // Store login session in localStorage
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("isLoggedIn", "true");

      // Redirect based on role
      if (user.role === "consumer") navigate("/bookingConsumer");
      else if (user.role === "transporter") navigate("/bookingTransporter");
      else if (user.role === "producer") navigate("/bookingProducer");
    } else {
      setError("Invalid username or password!");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center text-success">Olá!</h2>
      <form className="w-50 mx-auto p-4 border rounded shadow-sm" onSubmit={handleLogin}>
        {error && <p className="text-danger text-center">{error}</p>}
        <div className="mb-3">
          <label className="form-label">Username:</label>
          <input
            type="text"
            className="form-control"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password:</label>
          <input
            type="password"
            className="form-control"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn btn-success w-100">Login</button>
      </form>
    </div>
  );
}

export default Login;
