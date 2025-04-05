// === CheckoutPayment.jsx ===
import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { createPaymentIntent, confirmCardPayment } from "../services/paymentsService";

function CheckoutPayment() {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, getIdTokenClaims } = useAuth0();

  useEffect(() => {
    const fetchUserId = async () => {
      const claims = await getIdTokenClaims();
      if (claims) localStorage.setItem("userId", claims.sub);
    };
    if (isAuthenticated) fetchUserId();
  }, [isAuthenticated, getIdTokenClaims]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("Usuário não autenticado.");

      const paymentIntent = await createPaymentIntent(
        parseFloat(amount) * 100,
        userId
      );

       // Verificando se o Stripe e o Elements estão carregados corretamente
      if (!stripe || !elements) {
        setMessage("Stripe ainda não está carregado.");
        return;
      }

      const result = await confirmCardPayment(paymentIntent.transaction_id);

      if (result.status === "succeeded") {
        setMessage("✅ Pagamento confirmado com sucesso!");
        setAmount("");
      } else {
        setMessage(`⚠️ Pagamento com status: ${result.status}`);
      }
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem" }}>
      <h2>Checkout Seguro</h2>
      <form onSubmit={handleSubmit}>
        <label>Valor (€)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex: 20"
          required
        />
        <label>Cartão</label>
        <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "6px", marginBottom: "1rem" }}>
          <CardElement />
        </div>
        <button type="submit" disabled={!stripe || loading}>
          {loading ? "Processando..." : "Pagar"}
        </button>
      </form>
      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}

export default CheckoutPayment;