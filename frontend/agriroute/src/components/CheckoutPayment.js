import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import "./../styles/checkout.css";

const CheckoutPayment = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { getIdTokenClaims } = useAuth0(); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null); 
  const [error, setError] = useState(null); 
  const [success, setSuccess] = useState(false); 
  const [amount] = useState(1000); 

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        console.log("Tentando obter claims...");
        const claims = await getIdTokenClaims();  // Obtendo os claims do token
        if (claims) {
          const userId = claims.sub;  // O userId geralmente vem do claims.sub
          console.log("userId obtido:", userId);
          setUserId(userId);  // Armazenando o userId no estado
          localStorage.setItem("userId", userId);  // Salvando no localStorage, se necessário
        } else {
          console.log("Não foi possível obter os claims.");
        }
      } catch (error) {
        console.error("Erro ao obter os claims do token:", error);
      }
    };

    fetchUserId();
  }, [getIdTokenClaims]);  // Executa quando o getIdTokenClaims estiver disponível

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Iniciando pagamento...");

    setIsProcessing(true);

    try {
      const res = await fetch("http://localhost:8000/v1/payments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }) 
      });

      const { clientSecret  } = await res.json();
      
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setMessage(`❌ Erro no pagamento: ${result.error.message}`);
      } else if (result.paymentIntent.status === "succeeded") {
        setMessage("✅ Pagamento feito com sucesso!");
      }

    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }

    setIsProcessing(false);
  };

  return (
    <div className="checkout-container">
      <h2>Pagamento Seguro</h2>

      <div className="checkout-content">
        <div className="checkout-form">
          <Form onSubmit={handleSubmit}>
            <div className="form-group">
              <Form.Label>Detalhes do cartão</Form.Label>
              <CardElement className="card-element" />
            </div>

            {message && <Alert variant={success ? "success" : "danger"}>{message}</Alert>}
            <Button
              variant="primary"
              type="submit"
              disabled={isProcessing || !stripe || !elements}
              className="submit-button"
            >
              {isProcessing ? <Spinner animation="border" size="sm" /> : 'Pagar agora'}
            </Button>
          </Form>
        </div>

        <div className="checkout-summary">
          <h4>Resumo do pagamento</h4>
          <p><strong>Total:</strong> €{(amount / 100).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPayment;