import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useAuth0 } from "@auth0/auth0-react";
import "./../styles/booking.css";
import { createBooking, getBookingsByUser} from "../services/bookingService";

function BookingProducer() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState({}); 
  const {isAuthenticated, getIdTokenClaims } = useAuth0();
  const [authReady, setAuthReady] = useState(false); // Novo estado
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
    const storedUsername = localStorage.getItem("nickname") || "Produtor";
    setUsername(storedUsername);
    // console.log("Eventos carregados para a data:", formattedDate, selectedEvents);
  }, [formattedDate]);

  // 1. Primeiro: Buscar dados de autenticação
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

        // console.log("✅ Autenticação pronta");
        setAuthReady(true); // Marca que os dados de auth estão prontos

      } catch (error) {
        console.error("❌ Erro de autenticação:", error);
        setAuthReady(false);
      }
    };

    if (isAuthenticated) fetchAuthData();
    else setAuthReady(false);
  }, [isAuthenticated, getIdTokenClaims]);

  // 2. Segundo: Buscar bookings (só executa quando authReady = true)
  useEffect(() => {
    if (!authReady) return; // Não executa até a autenticação estar pronta

    const fetchBookings = async () => {
      try {
        const apiKey = localStorage.getItem("apikey");
        const userId = localStorage.getItem("userId");

        // console.log("🔍 Buscando bookings com:", { apiKey, userId, date: formattedDate });
        
        const bookings = await getBookingsByUser(apiKey, { date: formattedDate }, userId);
        // console.log("📦 Bookings recebidos:", bookings);

        const allBookings = await getBookingsByUser(apiKey, {}, userId);

        // console.log("🔍 Todas as bookings:", allBookings);

        // Processa as datas com eventos (formato YYYY-MM-DD)
        const uniqueDates = [...new Set(
          allBookings.map(b => new Date(b.datetime).toISOString().split('T')[0])
        )];

        // console.log("📅 Datas com eventos:", uniqueDates);
        setDatesWithBookings(uniqueDates);

        // console.log("📅 Estado atual de datesWithBookings:", datesWithBookings);
        // console.log("📅 Data sendo verificada:", date.toISOString().split("T")[0]);

        // console.log("📦 Dados brutos dos bookings:", bookings);
        // bookings.forEach((b, i) => {
        //   console.log(`📦 Booking ${i}:`, b);
        //   console.log(`🔍 Descrição ${i}:`, b.description);
        //   console.log(`⏰ Datetime ${i}:`, b.datetime);
        // });

        const mappedBookings = bookings.map((b) => {
          // Remove apenas a parte do User ID, mantendo Produto e Quantidade
          const descriptionWithoutUserId = b.description 
            ? b.description.split("| User ID")[0].trim() 
            : "Sem descrição";
          
          // Separa Produto e Quantidade (se necessário)
          const [productPart, quantityPart] = descriptionWithoutUserId.split("|").map(part => part.trim());
          
          // Verificação de segurança para datetime
          const eventTime = b.datetime ? new Date(b.datetime) : new Date();
          
          return {
            description: descriptionWithoutUserId, // Agora sem o User ID
            product: productPart?.replace("Produto:", "").trim() || "Produto não especificado",
            quantity: quantityPart?.replace("Quantidade:", "").trim() || "",
            time: eventTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: b.status || "Aguardando",
            rawData: b
          };
        });
        
        console.log("🔄 mappedBookings result:", mappedBookings);
        // console.log("🔍 mappedBookings:", mappedBookings);

        if (bookings.length > 0 && mappedBookings.length === 0) {
          console.error("❌ Transformação falhou:", {
            bookings,
            mappedBookings
          });
        }

        setEvents((prevEvents) => ({
          ...prevEvents,
          [formattedDate]: mappedBookings,
        }));
     
      } catch (error) {
        console.error("❌ Erro ao buscar bookings:", error);
      }
    };

    fetchBookings();
  }, [date, authReady]); // Adiciona authReady como dependência


  // Garantir que os eventos estão atualizados corretamente
  useEffect(() => {
    console.log("📅 Eventos para", formattedDate, ":", events[formattedDate] || []);
  }, [events]);

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
    let claims;
      
      // Espera até que o token de identidade (claims) esteja disponível
      while (!claims) {
        claims = await getIdTokenClaims(); // Obtém os claims do token
        if (!claims) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500ms e tenta novamente
        }
      }

    const apiKey = localStorage.getItem("apikey");
    console.log("apikey:", apiKey);
    const userId = claims.sub;
    console.log("userId:", userId);
    localStorage.setItem('userId', userId);
    
    const description = `Produto: ${product} | Quantidade: ${quantity}kg`;

    const bookingData = {
      datetime,
      duration: 3600,
      description,
    };

    try {
      await createBooking(bookingData, apiKey, userId);
      alert("✅ Pedido criado com sucesso!");


      // Atualizar eventos localmente
      setEvents((prevEvents) => ({
        ...prevEvents,
        [formattedDate]: [
          ...(prevEvents[formattedDate] || []),
          {
            description,
            time,
            status: "Aguardando",
          },
        ],
      }));

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
              const dateString = date.toISOString().split("T")[0];
              const hasBooking = datesWithBookings.includes(dateString);
              // console.log(`📅 ${dateString} - Tem booking? ${hasBooking}`);
              return hasBooking ? 'has-booking' : '';
            }}/>
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
