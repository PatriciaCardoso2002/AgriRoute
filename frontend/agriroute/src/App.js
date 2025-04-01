import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
// Import components
import { Home, BookingConsumer, BookingTransporter, BookingProducer, Login, Logo, LoginButton, LogoutButton, Profile , PaymentProducer } from './components';
import { useNavigate } from 'react-router-dom';
import BookingService from './services/bookingService';
import PaymentService from './services/paymentsService';

function App() {
  const [userRole, setUserRole] = useState("");
  const {isAuthenticated, getIdTokenClaims } = useAuth0();
  const [hasRedirectedAfterLogin, setHasRedirectedAfterLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {

    const checkRoleAndRedirect = async () => {
      let claims;
      
      // Espera até que o token de identidade (claims) esteja disponível
      while (!claims) {
        claims = await getIdTokenClaims(); // Obtém os claims do token
        if (!claims) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500ms e tenta novamente
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500ms e tenta novamente
      }
      // Agora que temos os claims, verificamos os roles
      const roles = claims["https://myapp.com/roles"] || [];
      console.log("🔐 Roles do user:", roles);
      const name = claims.name || "Anonymous";
      console.log("🔐 Name do user:", name);
      const userId = claims.sub || "iddddd";  // Aqui está o client id do Auth0
      console.log("🔐 ID do user:", userId);
      const nick = claims.nickname || "nickname";  // Aqui está o client id do Auth0
      console.log("🔐 nickname do user:", nick);
      localStorage.setItem("nickname", nick);
      const claim = claims || "claims";  // Aqui está o client id do Auth0
      console.log("🔐 claims do user:", claim);
      
      // try {
      //   // Verifica se já existe o client no Booking API
      //   const apikey = localStorage.getItem("apikey");
  
      //   if (!apikey) {
      //     // Criar novo cliente no BookingService
      //     const clientRes = await BookingService.createClient({ name });
  
      //     // Guarda a apikey no localStorage para chamadas futuras
      //     const newapikey = clientRes.apikey;
      //     localStorage.setItem("apikey", newapikey);
  
      //     console.log("✅ Cliente criado com sucesso:", clientRes);
      //   } else {
      //     console.log("🔐 API Key já existente no localStorage:", apikey);
      //   }
  
      // } catch (error) {
      //   console.error("❌ Erro ao criar/verificar cliente no serviço de bookings", error);
      // }
      try {
        // Verificar se o cliente já foi registrado, usando o email do usuário
        const existingClient = await BookingService.getClientByName("Agriroute");
      
        if (existingClient) {
          console.log('Cliente já existe, API Key:', existingClient.apikey);
          // Armazenar a API Key no localStorage
          localStorage.setItem('apikey', existingClient.apikey);
          localStorage.setItem('name', existingClient.name || name); // Usar o name do Auth0 se não tiver no cliente
        } else {
          // Se o cliente não existe, cria um novo cliente
          const newClient = await BookingService.createClient({ name: "Agriroute" });
          console.log('Novo cliente criado, API Key:', newClient.apikey);
          // Armazenar a nova API Key no localStorage
          localStorage.setItem('apikey', newClient.apikey);
          localStorage.setItem('name', "Agriroute"); // Usar o name do Auth0
        }
      } catch (error) {
        console.error('Erro ao verificar/criar cliente:', error);
      }

      if (roles.includes("producer")) {
        setUserRole("producer");
        navigate("/bookingProducer");
      } else if (roles.includes("transporter")) {
        setUserRole("transporter");
        navigate("/bookingTransporter");
      } else {
        navigate("/");
      }

    };

    if (isAuthenticated && !hasRedirectedAfterLogin) {
      checkRoleAndRedirect();
      setHasRedirectedAfterLogin(true);
    }
  }, [isAuthenticated, navigate, getIdTokenClaims, hasRedirectedAfterLogin]);

  return (
    // <Router>
      <div className="App">
      <header className="App-header custom-header p-4">
  {/* Navigation Bar */}
  <nav className="navbar navbar-expand-lg navbar-light bg-light">
    <div className="container">
      {/* Logo on the left side */}
      <div className="navbar-brand p-0">
        <Logo />
      </div>

      {/* Navbar Links */}
      <ul className="navbar-nav me-auto">
        <li className="nav-item">
          <Link to="/" className="nav-link">Home</Link>
        </li>

        {/* Show Booking Links Only If Logged In */}
        {/* {isAuthenticated && userRole === "consumer" && (
          <li className="nav-item">
            <Link to="/bookingConsumer" className="nav-link">Booking Consumer</Link>
          </li>
        )} */}
        {isAuthenticated && userRole === "transporter" && (
          <li className="nav-item">
            <Link to="/bookingTransporter" className="nav-link">Booking Transporter</Link>
          </li>
        )}
        {isAuthenticated && userRole === "producer" && (
         <>
         <li className="nav-item">
            <Link to="/bookingProducer" className="nav-link">Booking Producer</Link>
          </li>
          <li className="nav-item">
           <Link to="/payment" className="nav-link btn btn-success text-white ms-2">Pagamentos</Link>
          </li>
        </>
        )}
      </ul>

      {/* Show Login if Not Logged In, Logout if Logged In */}
      {/* {isLoggedIn ? (
        <button className="btn btn-danger" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> Logout
        </button>
      ) : (
        <LoginButton className="me-2"></LoginButton>
        // <Link to="/login" className="nav-link text-success fs-5">
        //   <FaUser className="me-2" />
        // </Link>
      )}
      <LogoutButton></LogoutButton>
      <Profile></Profile> */}
      <div className="d-flex align-items-center">
        {isAuthenticated ? (
          <>
            <Profile/> {/* Exibe o botão de perfil */}
            <LogoutButton /> {/* Exibe o botão de logout com o ícone */}
          </>
        ) : (
          <LoginButton /> 
        )}
    </div>
    </div>
  </nav>

  {/* Routes */}
  <div className="container mt-5">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bookingConsumer" element={<BookingConsumer />} />
      <Route path="/bookingTransporter" element={<BookingTransporter />} />
      <Route path="/bookingProducer" element={<BookingProducer />} />
      <Route path="/payment" element={<PaymentProducer />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  </div>
</header>
      </div>
    // </Router>
  );
}

export default App;
