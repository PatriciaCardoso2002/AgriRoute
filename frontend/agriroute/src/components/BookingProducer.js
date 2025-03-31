import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useAuth0 } from "@auth0/auth0-react";
import "./../styles/booking.css";
import { createBooking, getBookingsByUser } from "../services/bookingService";

function BookingProducer() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState({}); 
  const { isAuthenticated, getIdTokenClaims } = useAuth0();
  const [authReady, setAuthReady] = useState(false);
  const [datesWithBookings, setDatesWithBookings] = useState([]);
  const [newEvent, setNewEvent] = useState({
    product: "",
    quantity: "",
    time: "",
    notes: ""
  });

  const toLocalISODate = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split("T")[0];
  };

  const formattedDate = toLocalISODate(date);

  useEffect(() => {
    const storedUsername = localStorage.getItem("nickname") || "Produtor";
    setUsername(storedUsername);
  }, [formattedDate]);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        let claims;
        let attempts = 0;
        const maxAttempts = 5;

        while (!claims && attempts < maxAttempts) {
          attempts++;
          claims = await getIdTokenClaims();
          if (!claims) await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!claims) throw new Error("Não foi possível obter os claims do token");

        const apiKey = localStorage.getItem("apikey");
        if (!apiKey) throw new Error("API Key não encontrada");

        const userId = claims.sub;
        localStorage.setItem('userId', userId);

        setAuthReady(true);
      } catch (error) {
        console.error("❌ Erro de autenticação:", error);
        setAuthReady(false);
      }
    };

    if (isAuthenticated) fetchAuthData();
    else setAuthReady(false);
  }, [isAuthenticated, getIdTokenClaims]);

  useEffect(() => {
    if (!authReady) return;

    const fetchBookings = async () => {
      try {
        const apiKey = localStorage.getItem("apikey");
        const userId = localStorage.getItem("userId");
        
        const bookings = await getBookingsByUser(apiKey, { date: formattedDate }, userId);
        const allBookings = await getBookingsByUser(apiKey, {}, userId);

        const uniqueDates = [...new Set(
          allBookings.map(b => toLocalISODate(new Date(b.datetime)))
        )];
        setDatesWithBookings(uniqueDates);

        const mappedBookings = bookings.map((b) => {
          const parts = b.description ? b.description.split('|').map(part => part.trim()) : [];
          
          const result = {
            product: "Produto não especificado",
            quantity: "",
            time: "",
            status: "Pendente",
            notes: "",
            rawData: b
          };
        
          parts.forEach(part => {
            if (part.startsWith("Produto:")) result.product = part.replace("Produto:", "").trim();
            if (part.startsWith("Quantidade:")) result.quantity = part.replace("Quantidade:", "").trim();
            if (part.startsWith("Status:")) result.status = part.replace("Status:", "").trim();
            if (part.startsWith("Notas:")) result.notes = part.replace("Notas:", "").trim();
          });
        
          if (b.datetime) {
            const eventTime = new Date(b.datetime);
            result.time = eventTime.toLocaleTimeString('pt-PT', { hour: "2-digit", minute: "2-digit" });
          }
        
          return result;
        });

        setEvents((prevEvents) => ({
          ...prevEvents,
          [formattedDate]: mappedBookings,
        }));
      } catch (error) {
        console.error("❌ Erro ao buscar bookings:", error);
      }
    };

    fetchBookings();
  }, [date, authReady, formattedDate]);

  const selectedEvents = events[formattedDate] || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const { product, quantity, time, notes } = newEvent;

    if (!product || !quantity || !time) {
      alert("Produto, quantidade e hora são obrigatórios.");
      return;
    }

    // Corrigir formatação do tempo
    const [hours, minutes] = time.split(':');
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
    
    // Criar data no formato correto
    const datetime = new Date(`${formattedDate}T${formattedTime}`);
    datetime.setHours(datetime.getHours()); // Ajuste para timezone

    if (isNaN(datetime.getTime())) {
      alert("Data/hora inválida");
      return;
    }

    let claims;
    while (!claims) {
      claims = await getIdTokenClaims();
      if (!claims) await new Promise(resolve => setTimeout(resolve, 500));
    }

    const apiKey = localStorage.getItem("apikey");
    const userId = claims.sub;
    
    const description = `Produto: ${product} | Quantidade: ${quantity}kg | Status: Pendente | Notas: ${notes || 'Sem observações'}`;

    const bookingData = {
      datetime: datetime.toISOString(),
      duration: 3600,
      description,
    };

    try {
      await createBooking(bookingData, apiKey, userId);
      alert("✅ Pedido criado com sucesso!");

      setEvents((prevEvents) => ({
        ...prevEvents,
        [formattedDate]: [
          ...(prevEvents[formattedDate] || []),
          {
            product,
            quantity,
            time: formattedTime.slice(0, 5),
            notes: notes || "Sem observações",
            status: "Pendente",
            description
          },
        ],
      }));

      setNewEvent({ 
        product: "", 
        quantity: "", 
        time: "", 
        notes: ""
      });
    } catch (error) {
      console.error("❌ Erro ao criar booking:", error);
      let errorMsg = "Erro ao criar pedido";
      if (error.response) {
        errorMsg += `: ${error.response.data.message || error.response.statusText}`;
      }
      alert(errorMsg);
    }
  };

  return (
    <>
      <style>
        {`
          .has-booking {
            background-color: #c7f4c2 !important;
            font-weight: bold;
          }
          .status-pendente {
            color: #ffc107;
          }
          .status-confirmado {
            color: #28a745;
          }
          .status-cancelado {
            color: #dc3545;
          }
          .status-concluído {
            color: #17a2b8;
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
            tileClassName={({ date }) => {
              const dateString = toLocalISODate(date);
              return datesWithBookings.includes(dateString) ? 'has-booking' : '';
            }}
          />
        </div>

        <h4>Eventos para {formattedDate}:</h4>
        {selectedEvents.length === 0 ? (
          <p>Não existem eventos para esta data.</p>
        ) : (
          <div className="agenda-container">
            {selectedEvents.map((event, index) => (
              <div key={index} className="agenda-item">
                <h5>{event.product} - {event.quantity}</h5>
                <p>{event.time}</p>
                <p className={`status-${event.status.toLowerCase()}`}>
                  Status: {event.status}
                </p>
                {event.notes && <p>Observações: {event.notes}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="add-event-form">
          <h4>Adicionar novo pedido de recolha:</h4>
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
                type="time"
                name="time"
                value={newEvent.time}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label>Observações:</label>
              <textarea
                name="notes"
                value={newEvent.notes}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Informações adicionais para o transportador"
                rows="3"
              />
            </div>
            <button type="submit" className="btn btn-success">
              Adicionar
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default BookingProducer;