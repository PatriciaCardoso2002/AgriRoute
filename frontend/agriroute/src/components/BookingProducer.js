import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./../styles/booking.css";

function BookingProducer() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");
  
    // Fetch user info from localStorage (if available)
    useEffect(() => {
      const storedUsername = localStorage.getItem("username") || "Produtor";
      setUsername(storedUsername);
    }, []);
  
  const [newEvent, setNewEvent] = useState({
    product: "",
    quantity: "",
    time: "",
  });
  const [events, setEvents] = useState({
    "2025-03-12": [
      { title: "Maçãs - 100kg", time: "9h", status: "Aguardando" },
      { title: "Laranjas - 50kg", time: "11h", status: "Aguardando" }
    ],
    "2025-03-15": [
      { title: "Cebolas - 200kg", time: "10h", status: "Aguardando" }
    ],
    "2025-03-20": [
      { title: "Peras - 150kg", time: "8h", status: "Aguardando" }
    ]
  });

  // Format the selected date into YYYY-MM-DD format
  const formattedDate = date.toISOString().split("T")[0];

  // Get the events for the selected date (or empty array if none)
  const selectedEvents = events[formattedDate] || [];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  // Add a new event
  const handleAddEvent = (e) => {
    e.preventDefault();
    const { product, quantity, time } = newEvent;

    if (!product || !quantity || !time) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    const newEventData = {
      title: `${product} - ${quantity}kg`,
      time,
      status: "Aguardando", // New event starts with "Aguardando"
    };

    const updatedEvents = { ...events };

    if (!updatedEvents[formattedDate]) {
      updatedEvents[formattedDate] = [];
    }

    updatedEvents[formattedDate].push(newEventData);
    setEvents(updatedEvents);

    // Clear the form
    setNewEvent({ product: "", quantity: "", time: "" });
  };

  return (
    <div className="booking-container">
       <div className="welcome-section">
        <h2 className="text-success">Bem-vindo(a), {username}!</h2>
        <p className="lead">
          Aqui você pode consultar e adicionar novos pedidos de recolha dos seus produtos agrícolas.
        </p>
      </div>
      {/* Calendar Component */}
      <div className="calendar-container">
        <Calendar
          onChange={setDate}
          value={date}
          className="custom-calendar" // Apply custom CSS class for larger size
        />
      </div>

      <h4>Eventos para {formattedDate}:</h4>
      {selectedEvents.length === 0 ? (
        <p>Não existem eventos para esta data.</p>
      ) : (
        <div className="agenda-container">
          {selectedEvents.map((event, index) => (
            <div key={index} className="agenda-item">
              <h5>{event.title}</h5>
              <p>{event.time}</p>
              <p>Status: {event.status}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add a form to simulate booking new events */}
      <div className="add-event-form">
        <h4>Adiciona um novo pedido de recolha:</h4>
        <form onSubmit={handleAddEvent}>
          <div className="form-group">
            <label>Produto:</label>
            <input
              type="text"
              name="product"
              value={newEvent.product}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Nome do Produto"
              required
            />
          </div>
          <div className="form-group">
            <label>Quantidade (kg):</label>
            <input
              type="number"
              name="quantity"
              value={newEvent.quantity}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Quantidade"
              required
            />
          </div>
          <div className="form-group">
            <label>Hora:</label>
            <input
              type="text"
              name="time"
              value={newEvent.time}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Hora (ex: 9h)"
              required
            />
          </div>
          <button type="submit" className="btn btn-success">
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookingProducer;
