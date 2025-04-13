import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import "./../styles/checkout.css";
import { useNavigate } from 'react-router-dom';

const CheckoutPayment = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { getIdTokenClaims } = useAuth0();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState('');
  const [checkoutQuantity, setCheckoutQuantity] = useState('');
  const [checkoutPrice, setCheckoutPrice] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        console.log("Tentando obter claims...");
        const claims = await getIdTokenClaims();
        if (claims) {
          const userId = claims.sub;
          console.log("userId obtido:", userId);
          setUserId(userId);
          localStorage.setItem("userId", userId);
        } else {
          console.log("Não foi possível obter os claims.");
        }
      } catch (error) {
        console.error("Erro ao obter os claims do token:", error);
      }
    };

    fetchUserId();

    setCheckoutProduct(localStorage.getItem('checkoutProduct') || '');
    setCheckoutQuantity(localStorage.getItem('checkoutQuantity') || '');
    setCheckoutPrice(localStorage.getItem('checkoutPrice') || '');
  }, [getIdTokenClaims]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Iniciando pagamento...");

    setIsProcessing(true);

    const product = localStorage.getItem('checkoutProduct') || '';
    const quantity = localStorage.getItem('checkoutQuantity') || ''; 

    const formattedString = `${quantity} Kg de ${product}`;

    try {
      const res = await fetch("http://localhost:8000/v1/payments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, amount: parseFloat(checkoutPrice) * 100 || 0 , description : formattedString}),
      });

      const { clientSecret } = await res.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setMessage(`❌ Erro no pagamento: ${result.error.message}`);
      } else if (result.paymentIntent.status === "succeeded") {
        setMessage("✅ Pagamento feito com sucesso!");
        localStorage.removeItem('checkoutProduct');
        localStorage.removeItem('checkoutQuantity');
        localStorage.removeItem('checkoutPrice');
        //navigate('/payment-success');
      }

    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }

    setIsProcessing(false);
  };

  return (
    <div className="checkout-container">
      <h2>Faça o seu pagamento</h2>

      <div className="checkout-content">
        <div className="checkout-form">
          <Form onSubmit={handleSubmit}>
            <div className="form-group">
              <Form.Label>Introduza os dados do seu cartão:</Form.Label>
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
          {checkoutProduct && <p><strong>Produto:</strong> {checkoutProduct}</p>}
          {checkoutQuantity && <p><strong>Quantidade:</strong> {checkoutQuantity} kg</p>}
          <p><strong>Total:</strong> €{parseFloat(checkoutPrice || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPayment;