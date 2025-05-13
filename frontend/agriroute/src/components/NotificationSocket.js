import React, { useEffect, useState } from 'react';

const NotificationSocket = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const socket = new WebSocket(`ws://localhost:8002/v1/notifications/ws/${userId}`);

    socket.onopen = () => {
      console.log(`✅ WebSocket conectado como ${userId}`);
      socket.send("👋 Frontend conectado");
    };

    socket.onmessage = (event) => {
      const id = Date.now();
      const newMessage = { id, text: event.data };

      console.log("📩 Nova notificação:", newMessage.text);

      setMessages(prev => [...prev, newMessage]);
      setVisible(true);

      // Remove mensagem após 5s
      setTimeout(() => {
        setMessages(prev => {
          const updated = prev.filter(msg => msg.id !== id);
          // se ficou sem mensagens, esconde o painel
          if (updated.length === 0) setVisible(false);
          return updated;
        });
      }, 5000);
    };

    socket.onclose = () => {
      console.log("❌ WebSocket desconectado");
    };

    socket.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    return () => {
      socket.close();
    };
  }, [userId]);

  const handleClose = () => {
    setVisible(false);
    setMessages([]);
  };

  if (!visible || messages.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🔔 Notificações
        <button onClick={handleClose} style={styles.closeButton}>×</button>
      </div>
      <div style={styles.messageList}>
        {messages.map(msg => (
          <div key={msg.id} style={styles.message}>
            📨 {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 80,
    right: 20,
    width: 300,
    backgroundColor: '#f8f9fa',
    border: '1px solid #ced4da',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#343a40',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#6c757d',
    padding: 0
  },
  messageList: {
    maxHeight: 200,
    overflowY: 'auto'
  },
  message: {
    backgroundColor: '#e9ecef',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    fontSize: 14
  }
};

export default NotificationSocket;
