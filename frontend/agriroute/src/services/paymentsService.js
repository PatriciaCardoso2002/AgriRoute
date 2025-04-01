import axios from "axios";

export const createPaymentIntent = async (apiKey, amount, description, userId) => {
  try {
    const response = await axios.post(
      `/v1/payments/`,
      { amount,
        description, 
        user_id: userId 
        },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const confirmPayment = async (apiKey, paymentId, paymentMethod, returnUrl) => {
  try {
    const response = await axios.post(
      `/v1/payments/${paymentId}/confirm`,
      { payment_method: paymentMethod, return_url: returnUrl },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getPaymentStatus = async (apiKey, paymentId) => {
  try {
    const response = await axios.get(`/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getPaymentHistory = async (apiKey, userId) => {
  try {
    const response = await axios.get(`/v1/payments/${userId}/history`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const refundPayment = async (apiKey, paymentId) => {
  try {
    const response = await axios.post(
      `/v1/payments/${paymentId}/refund`,
      {},
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
