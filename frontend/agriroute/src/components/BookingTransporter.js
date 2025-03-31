import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./../styles/booking.css";
import { getBookings, updateBooking } from "../services/bookingService";

function BookingTransporter() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");
  const [bookings, setBookings] = useState([]);
  const [datesWithBookings, setDatesWithBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Format the selected date into YYYY-MM-DD format
  const formattedDate = date.toISOString().split("T")[0];

  // Parse pipe-separated description
  const parseDescription = (desc) => {
    const result = {
      clientName: "",
      status: "Pendente",
      product: "",
      quantity: "",
      notes: ""
    };
    
    if (!desc) return result;

    try {
      const parts = desc.split("|").map(part => part.trim());
      parts.forEach(part => {
        if (part.startsWith("NomeCliente:")) {
          result.clientName = part.replace("NomeCliente:", "").trim();
        } else if (part.startsWith("Status:")) {
          result.status = part.replace("Status:", "").trim();
        } else if (part.startsWith("Produto:")) {
          result.product = part.replace("Produto:", "").trim();
        } else if (part.startsWith("Quantidade:")) {
          result.quantity = part.replace("Quantidade:", "").trim();
        } else if (part.startsWith("Notas:")) {
          result.notes = part.replace("Notas:", "").trim();
        }
      });
    } catch (e) {
      console.error("Error parsing description:", desc, e);
    }
    
    return result;
  };

  // Load user name
  useEffect(() => {
    const storedUsername = localStorage.getItem("nickname") || "Transportador";
    setUsername(storedUsername);
  }, []);

  // Fetch bookings when date changes
  useEffect(() => {
    const fetchBookings = async () => {
      const apiKey = localStorage.getItem("apikey");
      if (!apiKey) {
        console.warn("⚠️ API Key não encontrada.");
        return;
      }

      setLoading(true);
      try {
        // Get bookings for the selected date
        const response = await getBookings(apiKey, { date: formattedDate });
        const dateBookings = response.data || [];

        // Get all bookings to mark dates in calendar
        const allResponse = await getBookings(apiKey);
        const allBookings = allResponse.data || [];

        // Get dates with bookings (normalized to YYYY-MM-DD format)
        const bookingDates = allBookings.map(b => {
          const d = new Date(b.datetime);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split("T")[0];
        });

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
            client: desc.clientName || "Cliente não especificado",
            notes: desc.notes || "Sem observações",
            rawDescription: booking.description
          };
        });

        setBookings(formattedBookings);
        setDatesWithBookings([...new Set(bookingDates)]);
      } catch (error) {
        console.error("❌ Erro ao buscar bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [date, formattedDate]);

  const handleStatusChange = async (bookingId, newStatus) => {
    const apiKey = localStorage.getItem("apikey");
    if (!apiKey) {
      alert("Sessão expirada. Por favor, faça login novamente.");
      return;
    }

    try {
      // Find the current booking
      const bookingToUpdate = bookings.find(b => b.id === bookingId);
      if (!bookingToUpdate) return;

      // Parse and update the description
      const desc = parseDescription(bookingToUpdate.rawDescription);
      const updatedDesc = `NomeCliente: ${desc.clientName} | Status: ${newStatus} | Produto: ${desc.product} | Quantidade: ${desc.quantity} | Notas: ${desc.notes}`;

      // Send to API
      await updateBooking(bookingId, { 
        description: updatedDesc 
      }, apiKey);
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { 
          ...booking, 
          status: newStatus,
          rawDescription: updatedDesc
        } : booking
      ));
      
      alert(`Status atualizado para "${newStatus}"`);
    } catch (error) {
      console.error("❌ Erro ao atualizar status:", error);
      alert("Erro ao atualizar status.");
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
            Aqui você pode visualizar e gerir os pedidos de recolha de produtos agrícolas.
          </p>
        </div>

        <div className="calendar-container">
          <Calendar
            onChange={setDate}
            value={date}
            className="custom-calendar"
            tileClassName={({ date }) => {
              const dateString = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              ).toISOString().split("T")[0];
              return datesWithBookings.includes(dateString) ? 'has-booking' : '';
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
                  {booking.client} - {booking.time}
                </h5>
                <p><strong>Produto:</strong> {booking.product}</p>
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