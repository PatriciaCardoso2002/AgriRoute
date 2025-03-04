import React, { useState } from "react";

const mockNotifications = [
  { id: 1, message: "Your booking for 50kg Blueberries has been confirmed!", date: "2025-03-02 10:30 AM", read: false },
  { id: 2, message: "Payment of $150 to Transporter X is pending.", date: "2025-03-01 08:15 AM", read: false },
  { id: 3, message: "New transport option available for your order!", date: "2025-02-28 05:45 PM", read: true },
];

function Notification() {
  const [notifications, setNotifications] = useState(mockNotifications);

  // 📌 Marcar como lida
  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  // 📌 Excluir notificação
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center text-primary">Notifications</h2>

      {notifications.length === 0 ? (
        <p className="text-center text-muted">No new notifications</p>
      ) : (
        <ul className="list-group">
          {notifications.map((notif) => (
            <li 
              key={notif.id} 
              className={`list-group-item d-flex justify-content-between align-items-center 
                          ${notif.read ? "bg-light" : "bg-white"} border`}
            >
              <div>
                <p className={`mb-1 ${notif.read ? "text-muted" : "fw-bold"}`}>{notif.message}</p>
                <small className="text-secondary">{notif.date}</small>
              </div>
              <div>
                {!notif.read && (
                  <button className="btn btn-sm btn-success me-2" onClick={() => markAsRead(notif.id)}>
                    ✅ Read
                  </button>
                )}
                <button className="btn btn-sm btn-danger" onClick={() => deleteNotification(notif.id)}>
                  🗑️ Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Notification;
