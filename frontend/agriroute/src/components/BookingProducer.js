import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./../styles/booking.css";
import { createBooking, getBookings } from "../services/bookingService";

function BookingProducer() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState({}); 
  const [datesWithBookings, setDatesWithBookings] = useState([]);
  const [newEvent, setNewEvent] = useState({
    product: "",
    quantity: "",
    time: "",
  });

  // Format the selected date into YYYY-MM-DD format
  const formattedDate = date.toISOString().split("T")[0];

  // Buscar nome do user e apiKey
  useEffect(() => {
    const storedUsername = localStorage.getItem("name") || "Produtor";
    setUsername(storedUsername);
    console.log("Eventos carregados para a data:", formattedDate, selectedEvents);
  }, [formattedDate]);

  // Buscar bookings do backend ao mudar de data
  useEffect(() => {
    const fetchBookings = async () => {
      const apiKey = localStorage.getItem("apikey");
      if (!apiKey) {
        console.warn("⚠️ API Key não encontrada.");
        return;
      }

      try {
        const response = await getBookings(apiKey, { date: formattedDate });
        const bookings = response.data || [];

        const response2 = await getBookings(apiKey);
        const allBookings = response2.data || [];

        // Obter todas as datas que possuem bookings
        const datesWithBookings = allBookings.map((b) => new Date(b.datetime).toISOString().split("T")[0]);


        const mappedBookings = bookings.map((b) => ({
          description: b.description,  // Use a descrição completa
          time: new Date(b.datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: b.status || "Aguardando",
        }));

        setEvents((prevEvents) => ({
          ...prevEvents,
          [formattedDate]: mappedBookings,
        }));

        setDatesWithBookings(datesWithBookings);
      } catch (error) {
        console.error("❌ Erro ao buscar bookings:", error);
      }
    };

    fetchBookings();
  }, [date]);

  const selectedEvents = events[formattedDate] || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const { product, quantity, time } = newEvent;

    if (!product || !quantity || !time) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    // Construir o datetime completo com data + hora
    const datetime = new Date(`${formattedDate}T${time.padStart(2, '0')}:00`);

    const apiKey = localStorage.getItem("apikey");
    console.log("apikey:", apiKey);
    
    const description = `Produto: ${product} | Quantidade: ${quantity}kg`;

    const bookingData = {
      datetime,
      duration: 3600,
      description,
    };

    try {
      await createBooking(bookingData, apiKey);
      alert("✅ Pedido criado com sucesso!");

      // Atualizar eventos localmente com a descrição completa
      const updatedEvents = { ...events };
      if (!updatedEvents[formattedDate]) {
        updatedEvents[formattedDate] = [];
      }

      updatedEvents[formattedDate].push({
        description,  // Agora armazenando a descrição
        time,
        status: "Aguardando",
      });

      setEvents(updatedEvents);  // Atualiza o estado com a descrição

      setNewEvent({ product: "", quantity: "", time: "" });
    } catch (error) {
      console.error("❌ Erro ao criar booking:", error);
      alert("Erro ao criar pedido.");
    }
  };

  return (
    <><style>
      {`
        .has-booking {
          background-color: #c7f4c2 !important;
          font-weight: bold;
        }
      `}
    </style>
    <div className="booking-container">
        <div className="welcome-section">
          <h2 className="text-success">Bem-vindo(a), {username}!</h2>
          <p className="lead">
            Aqui você pode consultar e adicionar novos pedidos de recolha dos seus produtos agrícolas.
          </p>
        </div>

        <div className="calendar-container">
          <Calendar
            onChange={setDate}
            value={date}
            className="custom-calendar"
            tileClassName={({ date, view }) => {
              // Verifica se a data está na lista de datas com bookings
              const dateString = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
              if (datesWithBookings.includes(dateString)) {
                return 'has-booking'; // Aplica a classe 'has-booking' se tiver eventos
              }
              return ''; // Caso contrário, não aplica nenhuma classe
            }} />
        </div>

        <h4>Eventos para {formattedDate}:</h4>
        {selectedEvents.length === 0 ? (
          <p>Não existem eventos para esta data.</p>
        ) : (
          <div className="agenda-container">
            {selectedEvents.map((event, index) => (
              <div key={index} className="agenda-item">
                <h5>{event.description}</h5> {/* Exibe o título formatado */}
                <p>{event.time}</p>
                <p>Status: {event.status}</p>
              </div>
            ))}
          </div>
        )}

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
                required />
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
                required />
            </div>
            <div className="form-group">
              <label>Hora:</label>
              <input
                type="time"
                name="time"
                value={newEvent.time}
                onChange={handleInputChange}
                className="form-control"
                required />
            </div>
            <button type="submit" className="btn btn-success">
              Adicionar
            </button>
          </form>
        </div>
      </div></>
  );
}

export default BookingProducer;
