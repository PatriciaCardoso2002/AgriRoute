import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  refundPayment,
} from "../services/paymentsService";
import "./../styles/payment.css";

function PaymentProducer() {
  const { isAuthenticated, getIdTokenClaims } = useAuth0();
  const [authReady, setAuthReady] = useState(false);
  const [username, setUsername] = useState("");
  const [payments, setPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({
    amount: "",
    description: "",
  });

  useEffect(() => {
      const storedUsername = localStorage.getItem("nickname") || "Produtor";
      setUsername(storedUsername);
    },);
  
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

    const fetchPayments = async () => {
      try {
        const apiKey = localStorage.getItem("apikey");
        const userId = localStorage.getItem("userId");
        const paymentHistory = await getPaymentHistory(apiKey, userId);
        setPayments(paymentHistory.payments);
      } catch (error) {
        console.error("❌ Erro ao procurar histórico de pagamentos:", error);
      }
    };

    fetchPayments();
  }, [authReady]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPayment({ ...newPayment, [name]: value });
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    const { amount, description } = newPayment;

    if (!amount || !description) {
      alert("Valor e descrição são obrigatórios.");
      return;
    }

    let claims;
    while (!claims) {
      claims = await getIdTokenClaims();
      if (!claims) await new Promise(resolve => setTimeout(resolve, 500));
    }

    const apiKey = localStorage.getItem("apikey");
    const userId = claims.sub;
    console.log("AQUIII" , userId);

    try {
      
      const paymentIntent = await createPaymentIntent(apiKey, amount * 100, description, userId);
      
      alert(`✅ Pagamento iniciado! ID da transação: ${paymentIntent.transaction_id}`);

      setNewPayment({ amount: "", description: "" });

      setPayments((prevPayments) => [
        ...prevPayments,
        {
          transaction_id: paymentIntent.transaction_id,
          amount,
          currency: "EUR",
          status: paymentIntent.status,
          description,
        },
      ]);
    } catch (error) {
      console.error("❌ Erro ao criar pagamento:", error);
      alert("Erro ao criar pagamento.");
    }
  };

  const handleRefund = async (transactionId) => {
    try {
      const apiKey = localStorage.getItem("apikey");
      await refundPayment(apiKey, transactionId);
      alert("✅ Reembolso realizado com sucesso!");

      setPayments((prevPayments) =>
        prevPayments.map((p) =>
          p.transaction_id === transactionId ? { ...p, status: "refunded" } : p
        )
      );
    } catch (error) {
      console.error("❌ Erro ao solicitar reembolso:", error);
      alert("Erro ao solicitar reembolso.");
    }
  };

  return (
    <div className="payment-container">
      <div className="welcome-section">
        <h2 className="text-primary">Bem-vindo(a), {username}!</h2>
        <p className="lead">
          Aqui você pode consultar e realizar pagamentos relacionados aos seus produtos agrícolas.
        </p>
      </div>

      <h4>Histórico de Pagamentos:</h4>
      {payments.length === 0 ? (
        <p>Não existem pagamentos registados.</p>
      ) : (
        <div className="payment-history">
          {payments.map((payment, index) => (
            <div key={index} className="payment-item">
              <h5>{payment.description}</h5>
              <p>Valor: {payment.amount} {payment.currency}</p>
              <p>Status: {payment.status}</p>
              {payment.status === "started" && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleRefund(payment.transaction_id)}
                >
                  Solicitar Reembolso
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h4>Realizar Pagamento:</h4>
      <form onSubmit={handleCreatePayment}>
        <input type="number" name="amount" value={newPayment.amount} onChange={handleInputChange} placeholder="Valor (€)" required />
        <input type="text" name="description" value={newPayment.description} onChange={handleInputChange} placeholder="Descrição" required />
        <button type="submit" className="btn btn-primary">Pagar</button>
      </form>
    </div>
  );
}

export default PaymentProducer;
