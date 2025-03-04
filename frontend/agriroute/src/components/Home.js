import React from "react";
import { Link } from "react-router-dom";
import "./../styles/home.css";
import blueberries from "./../images/blueberries.jpg"; 

function Home() {
  return (
    <div className="container mt-5 text-center">
      {/* 🔥 Imagem de Destaque */}
      <img src={blueberries} alt="Agriculture and Transport" className="img-fluid home-image rounded shadow-sm mb-4" />

      {/* 📌 Título e Descrição */}
      <h1 className="display-5 text-success fw-bold">Welcome to AgriRoute</h1>
      <p className="lead text-muted">
        The platform that connects **producers** and **transporters** to ensure the efficient delivery of fresh agricultural products.
      </p>

      {/* 🔗 Ações Principais */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <Link to="/booking" className="btn btn-success btn-lg">📦 Make a Booking</Link>
        <Link to="/payment" className="btn btn-outline-success btn-lg">💳 Manage Payments</Link>
      </div>

      {/* 📊 Estatísticas Simuladas */}
      <div className="row mt-5">
        <div className="col-md-4">
          <div className="p-4 border rounded shadow-sm bg-light">
            <h3 className="text-success">500+</h3>
            <p className="text-muted">Producers Registered</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-4 border rounded shadow-sm bg-light">
            <h3 className="text-success">200+</h3>
            <p className="text-muted">Active Transporters</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-4 border rounded shadow-sm bg-light">
            <h3 className="text-success">10,000+</h3>
            <p className="text-muted">Deliveries Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
