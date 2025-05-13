import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import "./../styles/checkout.css";
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../services/bookingService';

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

    const createBookingAfterPayment = async () => {
      try {
        const pendingBooking = JSON.parse(localStorage.getItem('pendingBooking') || '{}');
        const { product, quantity, time, notes, pickupAddress, deliveryAddress, formattedDate } = pendingBooking;
        
        if (!product || !quantity || !pickupAddress || !deliveryAddress) {
          console.error("❌ Dados de booking incompletos:", pendingBooking);
          return;
        }

        const apiKey = localStorage.getItem("apikey");
        const userId = localStorage.getItem("userId");

        console.log("🔑 apiKey:", apiKey);
        console.log("🧑 userId:", userId);

    
        const [hours, minutes] = time.split(':');
        const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
        const datetime = new Date(`${formattedDate}T${formattedTime}`);
        datetime.setHours(datetime.getHours());
    
        const description = `Produto: ${product} | Quantidade: ${quantity}kg | Status: Pendente | Notas: ${notes || 'Sem observações'} | Recolha: ${pickupAddress} | Entrega: ${deliveryAddress} | User ID: ${userId}`;
    
        const bookingData = {
          datetime: datetime.toISOString(),
          duration: 3600,
          description,
        };
    
        console.log("📤 Dados para criar booking:", bookingData);
        console.log("🔑 API Key:", apiKey);
    
        const response = await fetch('http://localhost:8002/agriRoute/v1/booking/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify(bookingData),
        });
    
        const result = await response.json();
        console.log("📥 Resposta do backend:", result);
    
      } catch (error) {
        console.error("❌ Erro ao criar booking após pagamento:", error);
      }
    };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Iniciando pagamento...");

    setIsProcessing(true);

    const product = localStorage.getItem('checkoutProduct') || '';
    const quantity = localStorage.getItem('checkoutQuantity') || ''; 
    const pendingBooking = JSON.parse(localStorage.getItem('pendingBooking') || {});

    const formattedString = `${quantity} Kg de ${product}`;

    try {
      const res = await fetch("http://localhost:8002/agriRoute/v1/payments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          user_id: userId, 
          amount: parseFloat(checkoutPrice) * 100 || 0,
          description: formattedString 
        }),
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
        
        // Criar o booking após o pagamento ser bem-sucedido
        await createBookingAfterPayment();
        
        // Limpar os dados temporários
        localStorage.removeItem('checkoutProduct');
        localStorage.removeItem('checkoutQuantity');
        localStorage.removeItem('checkoutPrice');
        localStorage.removeItem('pendingBooking');
        
        // Redirecionar de volta para a página de bookings após 2 segundos
        setTimeout(() => {
          navigate('/bookingProducer');
        }, 2000);
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