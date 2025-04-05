// === services/paymentsService.js ===
import axios from "axios";

const BASE_URL = 'http://localhost:8000/v1';

export const createPaymentIntent = async (amount, userId) => {
  try {
    const paymentIntent = await axios.post(`${BASE_URL}/payments/`, {
      amount,
      user_id: userId
    });
    return paymentIntent.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const confirmCardPayment = async (paymentId, paymentMethod) => {
  try {
    console.log("Enviando:", paymentMethod.id);
    const confirmation = await axios.post(`${BASE_URL}/payments/${paymentId}/confirm`, {
      payment_method: paymentMethod,
    });
    return confirmation.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};