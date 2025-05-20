import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useAuth0 } from "@auth0/auth0-react";
import "./../styles/booking.css";
import { getBookingsByUser, createBooking } from "../services/bookingService";
import { useNavigate } from "react-router-dom";

function BookingProducer() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState({});
  const {isAuthenticated, getIdTokenClaims, user } = useAuth0();
  const [authReady, setAuthReady] = useState(false);
  const [datesWithBookings, setDatesWithBookings] = useState([]);
  const [newEvent, setNewEvent] = useState({
    product: "",
    quantity: "",
    time: "",
    notes: "",
    pickupAddress: "",
    deliveryAddress: "",
    consumerEmail: "",
    consumerPhone: ""
  });

  const toLocalISODate = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split("T")[0];
  };

  const navigate = useNavigate();
  const formattedDate = toLocalISODate(date);

  useEffect(() => {
    const storedUsername = localStorage.getItem("nickname") || "Produtor";
    setUsername(storedUsername);
  }, [formattedDate]);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        let claims;
        for (let i = 0; i < 5 && !claims; i++) {
          claims = await getIdTokenClaims();
          if (!claims) await new Promise(res => setTimeout(res, 500));
        }

        if (!claims) throw new Error("Sem token");

        const userId = claims.sub;
        const apiKey =localStorage.getItem("apikey");
        console.log(apiKey)
        if (!apiKey) throw new Error("API Key não encontrada");

        localStorage.setItem("apikey", apiKey);
        localStorage.setItem("userId", userId);
        setAuthReady(true);
      } catch (err) {
        console.error("❌ Auth error:", err);
        setAuthReady(false);
      }
    };

    if (isAuthenticated) fetchAuth();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authReady) return;
    const fetchBookings = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const apiKey = localStorage.getItem("apikey");

        const bookings = await getBookingsByUser(apiKey, { date: formattedDate }, userId);
        const allBookings = await getBookingsByUser(apiKey, {}, userId);

        const uniqueDates = [...new Set(allBookings.map(b => toLocalISODate(new Date(b.datetime))))];
        setDatesWithBookings(uniqueDates);

        const mapped = bookings.map((b) => {
          const parts = (b.description || "").split("|").map(p => p.trim());
          const result = {
            product: "Produto não especificado",
            quantity: "",
            time: "",
            status: "Pendente",
            notes: "",
            pickupAddress: "",
            deliveryAddress: "",
            rawData: b
          };

          parts.forEach(part => {
            if (part.startsWith("Produto:")) result.product = part.replace("Produto:", "").trim();
            if (part.startsWith("Quantidade:")) result.quantity = part.replace("Quantidade:", "").trim();
            if (part.startsWith("Status:")) result.status = part.replace("Status:", "").trim();
            if (part.startsWith("Notas:")) result.notes = part.replace("Notas:", "").trim();
            if (part.startsWith("Recolha:")) result.pickupAddress = part.replace("Recolha:", "").trim();
            if (part.startsWith("Entrega:")) result.deliveryAddress = part.replace("Entrega:", "").trim();
          });

          if (b.datetime) {
            const d = new Date(b.datetime);
            result.time = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
          }

          return result;
        });

        setEvents((prevEvents) => ({
          ...prevEvents,
          [formattedDate]: mapped
        }));        
        
        setNewEvent({ 
          product: "", 
          quantity: "", 
          time: "", 
          notes: "",
          pickupAddress: "",
          deliveryAddress: ""
        });
        alert("✅ Pedido criado com sucesso!");
      } catch (err) {
        console.error("❌ Erro ao buscar bookings:", err);
      }
    };

    fetchBookings();
  }, [authReady, formattedDate, date]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const { product, quantity, time, notes, pickupAddress, deliveryAddress, consumerEmail, consumerPhone } = newEvent;

    if (!product || !quantity || !time || !pickupAddress || !deliveryAddress || !consumerEmail || !consumerPhone) {
      alert("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    const [hh, mm] = time.split(":");
    const datetime = new Date(`${formattedDate}T${hh}:${mm}:00`);

    const userId = localStorage.getItem("userId");
    const email = user?.email || "";
    const telemovel = localStorage.getItem("userPhone") || "";

    localStorage.setItem("pendingBooking", JSON.stringify({
      product, quantity, time, notes, pickupAddress, deliveryAddress,
      formattedDate, consumerEmail, consumerPhone
    }));

    localStorage.setItem("checkoutProduct", product);
    localStorage.setItem("checkoutQuantity", quantity);
    localStorage.setItem("checkoutPrice", (parseFloat(quantity) * 2.5).toFixed(2));

    navigate("/checkout");
  };

  // Verifica se há booking pendente e cria
  useEffect(() => {
    const pending = localStorage.getItem("bookingConfirmed");
    if (pending === "true") {
      const data = JSON.parse(localStorage.getItem("pendingBooking"));
      const apiKey = localStorage.getItem("apikey");
      const userId = localStorage.getItem("userId");
      const email = user?.email || "";
      const telemovel = localStorage.getItem("userPhone") || "";

      const [hh, mm] = data.time.split(":");
      const datetime = new Date(`${data.formattedDate}T${hh}:${mm}:00`).toISOString();

      const description = `Produto: ${data.product} | Quantidade: ${data.quantity}kg | Status: Pendente | Notas: ${data.notes || 'Sem observações'} | Recolha: ${data.pickupAddress} | Entrega: ${data.deliveryAddress} | Email Produtor: ${email} | Telemóvel Produtor: ${telemovel} | Email Consumidor: ${data.consumerEmail} | Telemóvel Consumidor: ${data.consumerPhone} | User ID: ${userId}`;

      const booking = {
        datetime,
        duration: 3600,
        description
      };

      createBooking(booking, apiKey).then(() => {
        console.log("✅ Booking criado após pagamento");
        localStorage.removeItem("pendingBooking");
        localStorage.removeItem("bookingConfirmed");
      }).catch(err => {
        console.error("❌ Erro ao criar booking após pagamento", err);
      });
    }
  }, []);

  const selectedEvents = events[formattedDate] || [];

  return (
    <>
      <style>
        {`.has-booking { background-color: #c7f4c2 !important; font-weight: bold; }
          .status-pendente { color: #ffc107; }
          .status-confirmado { color: #28a745; }
          .status-cancelado { color: #dc3545; }
          .status-concluído { color: #17a2b8; }`}
      </style>
      <div className="booking-container">
        <div className="welcome-section">
          <h2 className="text-success">Bem-vindo(a), {username}!</h2>
          <p className="lead">Aqui você pode consultar e adicionar novos pedidos de recolha.</p>
        </div>

        <div className="calendar-container">
          <Calendar
            onChange={setDate}
            value={date}
            className="custom-calendar"
            tileClassName={({ date }) => {
              return datesWithBookings.includes(toLocalISODate(date)) ? "has-booking" : "";
            }}
          />
        </div>

        <h4>Eventos para {formattedDate}:</h4>
        {selectedEvents.length === 0 ? (
          <p>Não existem eventos para esta data.</p>
        ) : (
          <div className="agenda-container">
            {selectedEvents.map((event, idx) => (
              <div key={idx} className="agenda-item">
                <h5>{event.product} - {event.quantity}</h5>
                <p>{event.time}h</p>
                <p><strong>Recolha:</strong> {event.pickupAddress}</p>
                <p><strong>Entrega:</strong> {event.deliveryAddress}</p>
                {event.notes && <p><strong>Observações:</strong> {event.notes}</p>}
                <p className={`status-${event.status.toLowerCase()}`}>Status: {event.status}</p>
              </div>
            ))}
          </div>
        )}

        <div className="add-event-form">
          <h4>Adicionar novo pedido de recolha:</h4>
          <form onSubmit={handleAddEvent}>
            <div className="form-group"><label>Produto:</label><input type="text" name="product" value={newEvent.product} onChange={handleInputChange} className="form-control" required /></div>
            <div className="form-group"><label>Quantidade (kg):</label><input type="number" name="quantity" value={newEvent.quantity} onChange={handleInputChange} className="form-control" required /></div>
            <div className="form-group"><label>Hora:</label><input type="time" name="time" value={newEvent.time} onChange={handleInputChange} className="form-control" required /></div>
            <div className="form-group"><label>Morada de Recolha:</label><input type="text" name="pickupAddress" value={newEvent.pickupAddress} onChange={handleInputChange} className="form-control" required /></div>
            <div className="form-group"><label>Morada de Entrega:</label><input type="text" name="deliveryAddress" value={newEvent.deliveryAddress} onChange={handleInputChange} className="form-control" required /></div>
            <div className="form-group"><label>Observações:</label><textarea name="notes" value={newEvent.notes} onChange={handleInputChange} className="form-control" rows="3" /></div>
            <div className="form-group"><label>Email do Consumidor:</label><input type="email" name="consumerEmail" value={newEvent.consumerEmail} onChange={handleInputChange} className="form-control" required /></div>
            <div className="form-group"><label>Telemóvel do Consumidor:</label><input type="tel" name="consumerPhone" value={newEvent.consumerPhone} onChange={handleInputChange} className="form-control" required /></div>
            <button type="submit" className="btn btn-success">Avançar para o pagamento</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default BookingProducer;
