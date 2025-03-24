import { Link } from "react-router-dom";
import "./../styles/home.css";
import strawberries from "./../images/strawberries.jpg"; 
import React, { useEffect } from "react";

function Home() {

  return (
    <div className="container mt-5 text-center">
      {/* 🔥 Imagem de Destaque */}
      <img src={strawberries} alt="Agriculture and Transport" className="img-fluid home-image rounded shadow-sm mb-4" />

      {/* 📌 Título e Descrição */}
      <h1 className="display-5 text-success fw-bold">Bem vindo(a) à AgriRoute</h1>
      <p className="lead text-muted">
      A plataforma que conecta produtores agrícolas, transportadores e consumidores, garantindo a entrega rápida e eficiente de produtos frescos em todo o país.
      </p>

      {/* 📊 Estatísticas Simuladas */}
      <div className="row mt-5">
        <div className="col-md-4">
          <div className="p-4 border rounded shadow-sm bg-light">
            <h3 className="text-success">500+</h3>
            <p className="text-muted">Produtores Registados</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-4 border rounded shadow-sm bg-light">
            <h3 className="text-success">200+</h3>
            <p className="text-muted">Transportadores Ativos</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-4 border rounded shadow-sm bg-light">
            <h3 className="text-success">10,000+</h3>
            <p className="text-muted">Entregas Concluídas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
