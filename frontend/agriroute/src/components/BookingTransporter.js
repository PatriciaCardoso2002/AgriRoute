import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useAuth0 } from "@auth0/auth0-react";
import "./../styles/booking.css";
import { getBookings, updateBooking } from "../services/bookingService";

function BookingTransporter() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");
  const [bookings, setBookings] = useState([]);
  const [datesWithBookings, setDatesWithBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { isAuthenticated, getIdTokenClaims } = useAuth0();
  const [authReady, setAuthReady] = useState(false);

  const toLocalISODate = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split("T")[0];
  };

  const isSameDate = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Format the selected date into YYYY-MM-DD format
  const formattedDate = toLocalISODate(date); 
  // Parse pipe-separated description
  const parseDescription = (desc) => {
    const result = {
      clientName: "",
      status: "Pendente",
      product: "",
      quantity: "",
      notes: "",
      userId: ""
    };
    
    if (!desc) return result;
  
    // Extrair User ID primeiro se existir
    if (desc.includes("User ID:")) {
      result.userId = desc.split("User ID:")[1].trim();
      desc = desc.split("User ID:")[0].trim();
    }
  
    // Processar as outras partes
    const parts = desc.split("|").map(part => part.trim());
    
    parts.forEach(part => {
      if (part.startsWith("Produto:")) {
        result.product = part.replace("Produto:", "").trim();
      } else if (part.startsWith("Quantidade:")) {
        result.quantity = part.replace("Quantidade:", "").trim();
      } else if (part.startsWith("Status:")) {
        result.status = part.replace("Status:", "").trim();
      } else if (part.startsWith("Notas:")) {
        result.notes = part.replace("Notas:", "").trim();
      } else if (part.startsWith("Cliente:")) {
        result.clientName = part.replace("Cliente:", "").trim();
      }
    });
    
    return result;
  };

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

        setAuthReady(true);

      } catch (error) {
        console.error("❌ Erro de autenticação:", error);
        setAuthReady(false);
      }
    };

    if (isAuthenticated) fetchAuthData();
    else setAuthReady(false);
  }, [isAuthenticated, getIdTokenClaims]);

  // Load user name
  useEffect(() => {
    const storedUsername = localStorage.getItem("nickname") || "Transportador";
    setUsername(storedUsername);
  }, []);

  // 2. Segundo: Buscar bookings (só executa quando authReady = true)
  useEffect(() => {
    if (!authReady) return;

    const fetchBookings = async () => {
      const apiKey = localStorage.getItem("apikey");
      if (!apiKey) {
        console.warn("⚠️ API Key não encontrada.");
        return;
      }

      setLoading(true);
      try {
        // Get all bookings (no filtering by user as we want all Agriroute bookings)
        const response = await getBookings(apiKey);
        const allBookings = response.data || [];

        // Get dates with bookings (normalized to YYYY-MM-DD format)
        const bookingDates = [...new Set(
          allBookings.map(b => new Date(b.datetime).toISOString().split('T')[0])
        )];
        setDatesWithBookings(bookingDates);

        // Filter bookings for the selected date
        const dateBookings = allBookings.filter(b => 
          isSameDate(new Date(b.datetime), date)
        );

        // Format bookings for display
        const formattedBookings = dateBookings.map(booking => {
          const desc = parseDescription(booking.description);
          
          return {
            id: booking.bookingId || booking.id,
            datetime: new Date(booking.datetime),
            time: new Date(booking.datetime).toLocaleTimeString('pt-PT', { 
              hour: "2-digit", 
              minute: "2-digit",
              hour12: false 
            }),
            product: desc.product || "Produto não especificado",
            quantity: desc.quantity || "Quantidade não especificada",
            status: desc.status || "Pendente",
            notes: desc.notes || "Sem observações",
            rawDescription: booking.description
          };
        });

        setBookings(formattedBookings);
      } catch (error) {
        console.error("❌ Erro ao buscar bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [date, authReady]);

  const handleStatusChange = async (bookingId, newStatus) => {
    const apiKey = localStorage.getItem("apikey");
    if (!apiKey) {
      alert("Sessão expirada. Por favor, faça login novamente.");
      return;
    }
  
    try {
      const bookingToUpdate = bookings.find(b => b.id === bookingId);
      if (!bookingToUpdate) return;
  
      // Parse a descrição existente de forma mais robusta
      const descParts = {
        clientName: bookingToUpdate.clientName || "",
        product: bookingToUpdate.product || "",
        quantity: bookingToUpdate.quantity || "",
        status: newStatus, // Novo status
        notes: bookingToUpdate.notes || "",
        userId: bookingToUpdate.rawDescription.includes("User ID:") 
          ? bookingToUpdate.rawDescription.split("User ID:")[1].trim()
          : ""
      };
  
      // Construa a nova descrição de forma consistente
      const updatedDesc = [
        `Produto: ${descParts.product}`,
        `Quantidade: ${descParts.quantity}`,
        `Status: ${descParts.status}`,
        `Notas: ${descParts.notes}`,
        descParts.userId ? `User ID: ${descParts.userId}` : ""
      ].filter(Boolean).join(" | ");
  
      // Debug: Mostrar o que será enviado
      console.log("Updating booking with:", {
        id: bookingId,
        description: updatedDesc
      });
  
      await updateBooking(bookingId, { 
        description: updatedDesc 
      }, apiKey);
      
      // Recarregue os bookings do servidor após a atualização
      const response = await getBookings(apiKey);
      const allBookings = response.data || [];
      
      const dateBookings = allBookings.filter(b => 
        new Date(b.datetime).toISOString().split('T')[0] === formattedDate
      );
  
      const formattedBookings = dateBookings.map(booking => {
        const desc = parseDescription(booking.description);
        return {
          id: booking.bookingId || booking.id,
          datetime: new Date(booking.datetime),
          time: new Date(booking.datetime).toLocaleTimeString('pt-PT', { 
            hour: "2-digit", 
            minute: "2-digit",
            hour12: false 
          }),
          product: desc.product || "Produto não especificado",
          quantity: desc.quantity || "Quantidade não especificada",
          status: desc.status || "Pendente",
          notes: desc.notes || "Sem observações",
          rawDescription: booking.description
        };
      });
  
      setBookings(formattedBookings);
      
      alert(`Status atualizado para "${newStatus}"`);
    } catch (error) {
      console.error("❌ Erro ao atualizar status:", error);
      alert("Erro ao atualizar status. Verifique o console para mais detalhes.");
    }
  };
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
  };

  return (
    <>
      <style>
        {`
          .has-booking {
            background-color: #c7f4c2 !important;
            font-weight: bold;
          }
          .status-pending {
            color: #ff9800;
          }
          .status-confirmed {
            color: #4caf50;
          }
          .status-cancelled {
            color: #f44336;
          }
          .status-completed {
            color: #2196f3;
          }
          .booking-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
          }
        `}
      </style>
      <div className="booking-container">
        <div className="welcome-section">
          <h2 className="text-success">Bem-vindo(a), {username}!</h2>
          <p className="lead">
            Aqui você pode visualizar e gerir os pedidos de recolha dos produtores agrícolas.
          </p>
        </div>

        <div className="calendar-container">
          <Calendar
            onChange={setDate}
            value={date}
            className="custom-calendar"
            tileClassName={({ date }) => {
              const hasBooking = datesWithBookings.some(d => 
                isSameDate(new Date(d), date)
              );
              return hasBooking ? 'has-booking' : '';
            }}
          />
        </div>

        <h4>Pedidos para {formattedDate}:</h4>
        {loading ? (
          <p>Carregando...</p>
        ) : bookings.length === 0 ? (
          <p>Não existem pedidos para esta data.</p>
        ) : (
          <div className="agenda-container">
            {bookings.map((booking, index) => (
              <div 
                key={index} 
                className="agenda-item"
                onClick={() => handleBookingClick(booking)}
                style={{ cursor: 'pointer' }}
              >
                <h5 className={`status-${(booking.status || '').toLowerCase()}`}>
                  {booking.time} - {booking.product}
                </h5>
                <p><strong>Quantidade:</strong> {booking.quantity}</p>
                <p><strong>Observações:</strong> {booking.notes}</p>
                <p>
                  <strong>Status:</strong> 
                  <span className={`status-${(booking.status || '').toLowerCase()}`}>
                    {booking.status}
                  </span>
                </p>
                
                {selectedBooking && selectedBooking.id === booking.id && (
                  <div className="booking-details">
                    <div className="btn-group">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(booking.id, "Confirmado");
                        }}
                        disabled={booking.status === "Confirmado"}
                      >
                        Confirmar
                      </button>
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(booking.id, "Pendente");
                        }}
                        disabled={booking.status === "Pendente"}
                      >
                        Pendente
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(booking.id, "Cancelado");
                        }}
                        disabled={booking.status === "Cancelado"}
                      >
                        Cancelar
                      </button>
                      <button 
                        className="btn btn-info btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(booking.id, "Concluído");
                        }}
                        disabled={booking.status === "Concluído"}
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default BookingTransporter;