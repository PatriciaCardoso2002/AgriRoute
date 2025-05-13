import axios from 'axios';

const BASE_URL = 'http://localhost:8002/agriRoute/v1/';

//              HEADER: 
const withApiKey = (apiKey) => ({
    headers: { 'api-key': apiKey }
  });

//              CLIENTS: 

export const createClient = async (data) => {
  const response = await axios.post(`${BASE_URL}/clients`, data);
  return response.data;
};

export const getClients = async () => {
  return axios.get(`${BASE_URL}/clients`);
};

export const getClientById = async (id) => {
  return axios.get(`${BASE_URL}/clients/${id}`);
};

export const getClientByApiKey = async (apiKey) => {
    try {
      const response = await axios.get(`${BASE_URL}/clients/client/${apiKey}`);
      console.log("📡 Resposta completa da API:", response);
      return response.data; // ← garantir que é só o "body"
    } catch (error) {
      console.error("❌ Erro ao obter cliente por API Key:", error);
      throw error;
    }
  };

export const updateClient = async (id, data) => {
  return axios.patch(`${BASE_URL}/clients/${id}`, data);
};

export const deleteClient = async (id) => {
  return axios.delete(`${BASE_URL}/clients/${id}`);
};

// Função para buscar um cliente na API de Booking por name ou identificador
const getClientByName = async (name) => {
    try {
      const response = await axios.get(`${BASE_URL}/clients`);
      const clients = response.data;
  
      // Procurar pelo nome 
      const matchingClient = clients.find(client => client.name === name);
  
      return matchingClient || null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      throw error;
    }
};


//              BOOKINGS: 
  export const createBooking = async (data, apiKey) => {
    
    return axios.post(`${BASE_URL}/bookings`, data, {
      ...withApiKey(apiKey),
    });
  };
  
  export const getBookings = async (apiKey, filters = {}) => {
    return axios.get(`${BASE_URL}/bookings`, {
        ...withApiKey(apiKey),
      params: filters,
    });
  };

  export const getBookingsByUser = async (apiKey, filters = {}, userId) => {
    try {
      console.log("\n\n\n\n No booking Service: \n🔑 API Key sendo usada:", apiKey);
      console.log("🔍 Filtros sendo passados:", filters);
      
      const response = await axios.get(`${BASE_URL}/bookings`, {
        ...withApiKey(apiKey),
        params: filters,
      });
      
      console.log("📡 Resposta completa da API:", response);
      let bookings = response.data || [];
      console.log("📝 Todos os bookings antes do filtro:", bookings);
  
      if (userId) {
        console.log("🔍 Filtrando por User ID:", userId);
        bookings = bookings.filter(booking => {
          const hasUserId = booking.description && booking.description.includes(`User ID: ${userId}`);
          console.log(`Booking ${booking.id} - Contém User ID? ${hasUserId}`);
          return hasUserId;
        });
      }
      
      console.log("✅ Bookings após filtro:", bookings);
      return bookings;
    } catch (error) {
      console.error("❌ Erro detalhado:", error.response || error);
      throw error;
    }
  };
  
  export const getBookingById = async (id, apiKey) => {
    return axios.get(`${BASE_URL}/bookings/${id}`, {
        ...withApiKey(apiKey),
    });
  };
  
  export const updateBooking = async (id, data, apiKey) => {
    console.log("Enviando atualização para o servidor:", {
      id,
      data,
      apiKey: apiKey ? "***" + apiKey.slice(-4) : "none"
    });
    
    try {
      const response = await axios.patch(`${BASE_URL}/bookings/${id}`, data, {
        ...withApiKey(apiKey),
      });
      
      console.log("Resposta do servidor:", response.data);
      return response;
    } catch (error) {
      console.error("Erro detalhado na atualização:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  };
  
  export const deleteBooking = async (id, apiKey) => {
    return axios.delete(`${BASE_URL}/bookings/${id}`, {
        ...withApiKey(apiKey),
    });
  };
  
  export const checkAvailability = async (datetime, duration, apiKey) => {
    return axios.get(`${BASE_URL}/bookings/checkAvailability`, {
        ...withApiKey(apiKey),
      params: { datetime, duration },
    });
  };
  
  export const getFreeSlots = async (start, end, apiKey) => {
    return axios.get(`${BASE_URL}/bookings/free-slots`, {
        ...withApiKey(apiKey),
      params: { start, end },
    });
  };
  

  export default {
    // Clients
    createClient,
    getClients,
    getClientById,
    getClientByApiKey,
    updateClient,
    deleteClient,
    getClientByName,
    
    // Bookings
    createBooking,
    getBookings,
    getBookingsByUser,
    getBookingById,
    updateBooking,
    deleteBooking,
    checkAvailability,
    getFreeSlots,
  };
  