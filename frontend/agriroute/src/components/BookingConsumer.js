import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./../styles/booking.css";

function BookingConsumer() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");

  // Fetch user info from localStorage (if available)
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "Consumidor";
    setUsername(storedUsername);
  }, []);

  const [newOrder, setNewOrder] = useState({
    product: "",
    quantity: "",
    deliveryTime: "9h",  // Tempo de entrega por padrão
    type: "Encomenda", // Tipo padrão é "Encomenda"
  });
  
  const [deliveries, setDeliveries] = useState({
    "2025-03-12": [
      { title: "Maçãs - 100kg", time: "9h", type: "Recebimento" },
      { title: "Laranjas - 50kg", time: "11h", type: "Recebimento" },
    ],
    "2025-03-15": [
      { title: "Cebolas - 200kg", time: "10h", type: "Recebimento" }
    ],
    "2025-03-20": [
      { title: "Peras - 150kg", time: "8h", type: "Recebimento" }
    ],
  });

  // Formatar a data selecionada para o formato YYYY-MM-DD
  const formattedDate = date.toISOString().split("T")[0];

  // Obter os eventos (entregas/encomendas) para a data selecionada
  const selectedDeliveries = deliveries[formattedDate] || [];

  // Submeter uma nova encomenda
  const handleOrderSubmit = (e) => {
    e.preventDefault();

    // Adicionar a nova encomenda ao estado de entregas
    const newDelivery = {
      title: `${newOrder.product} - ${newOrder.quantity}kg`,
      time: newOrder.deliveryTime,
      type: newOrder.type
    };

    // Atualizar a lista de entregas para o dia selecionado
    setDeliveries({
      ...deliveries,
      [formattedDate]: [...(deliveries[formattedDate] || []), newDelivery]
    });

    // Resetar o formulário após envio
    setNewOrder({
      product: "",
      quantity: "",
      deliveryTime: "9h",
      type: "Encomenda", // Resetar para "Encomenda" como padrão
    });
  };

  return (
    <div className="booking-container">
      <div className="welcome-section">
        <h2 className="text-success">Bem-vindo(a), {username}!</h2>
        <p className="lead">
          Aqui você pode consultar e adicionar os seus recebimentos e fazer novas encomendas.
        </p>
      </div>
      {/* Calendário */}
      <div className="calendar-container">
        <Calendar
          onChange={setDate}
          value={date}
          className="custom-calendar"
        />
      </div>

      <h4>Eventos para {formattedDate}:</h4>
      {selectedDeliveries.length === 0 ? (
        <p>Não existem eventos para esta data.</p>
      ) : (
        <div className="delivery-container">
          {selectedDeliveries.map((delivery, index) => (
            <div key={index} className="delivery-item">
              <h5>{delivery.title}</h5>
              <p>Hora: {delivery.time}</p>
              <p>Tipo: {delivery.type}</p>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de nova encomenda */}
      <div className="order-form">
        <h4>Adiciona um novo evento:</h4>
        <form onSubmit={handleOrderSubmit}>
          <div className="form-group">
            <label>Produto:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nome do Produto"
              value={newOrder.product}
              onChange={(e) =>
                setNewOrder({ ...newOrder, product: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Quantidade (kg):</label>
            <input
              type="number"
              className="form-control"
              placeholder="Quantidade"
              value={newOrder.quantity}
              onChange={(e) =>
                setNewOrder({ ...newOrder, quantity: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Hora de Entrega:</label>
            <input
              type="time"
              className="form-control"
              value={newOrder.deliveryTime}
              onChange={(e) =>
                setNewOrder({ ...newOrder, deliveryTime: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Tipo de Evento:</label>
            <select
              className="form-control"
              value={newOrder.type}
              onChange={(e) =>
                setNewOrder({ ...newOrder, type: e.target.value })
              }
            >
              <option value="Encomenda">Encomenda</option>
              <option value="Recebimento">Recebimento</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success">
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookingConsumer;
