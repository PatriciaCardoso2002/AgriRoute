import React, { useState, useEffect} from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./../styles/booking.css";

function BookingTransporter() {
  const [date, setDate] = useState(new Date());
  const [username, setUsername] = useState("");
  
    // Fetch user info from localStorage (if available)
    useEffect(() => {
      const storedUsername = localStorage.getItem("username") || "Transportador";
      setUsername(storedUsername);
    }, []);

  const [newTask, setNewTask] = useState({
    product: "",
    pickup: "",
    delivery: "",
    time: "9h", // Hora de entrega inicial
    status: "Aguardando", // Status inicial
  });
  const [tasks, setTasks] = useState({
    "2025-03-12": [
      {
        product: "Maçãs - 100kg",
        pickup: "Producer A - Address",
        delivery: "Consumer X - Address",
        time: "9h",
        status: "Aguardando"
      },
      {
        product: "Laranjas - 50kg",
        pickup: "Producer B - Address",
        delivery: "Consumer Y - Address",
        time: "11h",
        status: "Aguardando"
      }
    ],
    "2025-03-15": [
      {
        product: "Cebolas - 200kg",
        pickup: "Producer C - Address",
        delivery: "Consumer Z - Address",
        time: "10h",
        status: "Aguardando"
      }
    ],
    "2025-03-20": [
      {
        product: "Peras - 150kg",
        pickup: "Producer D - Address",
        delivery: "Consumer W - Address",
        time: "8h",
        status: "Aguardando"
      }
    ]
  });

  // Format the selected date into YYYY-MM-DD format
  const formattedDate = date.toISOString().split("T")[0];

  // Get the transport tasks for the selected date (or empty array if none)
  const selectedTasks = tasks[formattedDate] || [];

  // Update task status (e.g., when a task is completed)
  const updateTaskStatus = (index, newStatus) => {
    const updatedTasks = [...selectedTasks];
    updatedTasks[index].status = newStatus;
    setTasks({
      ...tasks,
      [formattedDate]: updatedTasks
    });
  };

  // Handle adding new delivery task
  const handleTaskSubmit = (e) => {
    e.preventDefault();

    const newDelivery = {
      product: newTask.product,
      pickup: newTask.pickup,
      delivery: newTask.delivery,
      time: newTask.time,
      status: newTask.status,
      type: newTask.type
    };

    // Add the new delivery to the selected date's tasks
    setTasks({
      ...tasks,
      [formattedDate]: [...selectedTasks, newDelivery]
    });

    // Reset the form after submission
    setNewTask({
      product: "",
      pickup: "",
      delivery: "",
      time: "9h",
      status: "Aguardando",
      type: ""
    });
  };

  return (
    <div className="booking-container">
      <div className="welcome-section">
        <h2 className="text-success">Bem-vindo(a), {username}!</h2>
        <p className="lead">
          Aqui você pode consultar e adicionar recolhas e entregas.
        </p>
      </div>
      {/* Calendar Component */}
      <div className="calendar-container">
        <Calendar
          onChange={setDate}
          value={date}
          className="custom-calendar"
        />
      </div>

      <h4>Eventos para {formattedDate}:</h4>
      {selectedTasks.length === 0 ? (
        <p>Não existem eventos para esta data.</p>
      ) : (
        <div className="tasks-container">
          {selectedTasks.map((task, index) => (
            <div key={index} className="task-item">
              <h5>{task.product}</h5>
              <p>Recolha: {task.pickup}</p>
              <p>Entrega: {task.delivery}</p>
              <p>Hora: {task.time}</p>
              <p>Status: {task.status}</p>

              <div className="status-actions">
                {task.status === "Aguardando" && (
                  <button
                    onClick={() => updateTaskStatus(index, "A caminho")}
                    className="btn btn-secondary"
                  >
                    A caminho
                  </button>
                )}
                {task.status === "A caminho" && (
                  <button
                    onClick={() => updateTaskStatus(index, "Concluída")}
                    className="btn btn-success"
                  >
                    Concluída
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário para adicionar nova tarefa */}
      <div className="add-task-form">
        <h4>Adiciona um novo evento:</h4>
        <form onSubmit={handleTaskSubmit}>
          <div className="form-group">
            <label>Produto:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nome do Produto"
              value={newTask.product}
              onChange={(e) =>
                setNewTask({ ...newTask, product: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Endereço de Recolha:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Endereço de Recolha"
              value={newTask.pickup}
              onChange={(e) =>
                setNewTask({ ...newTask, pickup: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Endereço de Entrega:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Endereço de Entrega"
              value={newTask.delivery}
              onChange={(e) =>
                setNewTask({ ...newTask, delivery: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Hora de Entrega:</label>
            <input
              type="time"
              className="form-control"
              value={newTask.time}
              onChange={(e) =>
                setNewTask({ ...newTask, time: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Tipo de Evento:</label>
            <select
              className="form-control"
              value={newTask.type}
              onChange={(e) =>
                setNewTask({ ...newTask, type: e.target.value })
              }
            >
              <option value="Recolha">Recolha</option>
              <option value="Entrega">Entrega</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success">
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookingTransporter;
