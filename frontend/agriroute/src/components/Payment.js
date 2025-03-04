import React, { useState } from "react";

const mockPayments = [
  { id: 1, sender: "Producer A", receiver: "Transporter X", amount: "$150", status: "Completed" },
  { id: 2, sender: "Producer B", receiver: "Transporter Y", amount: "$220", status: "Pending" },
];

function Payment() {
  const [paymentDetails, setPaymentDetails] = useState({
    amount: "",
    method: "PayPal",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({ ...paymentDetails, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Payment submitted (static example)");
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center text-primary">Payment Page</h2>

      {/* 📝 Static List of Past Payments */}
      <div className="mb-4">
        <h4>Recent Transactions</h4>
        <table className="table table-bordered">
          <thead className="table-success">
            <tr>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockPayments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.sender}</td>
                <td>{payment.receiver}</td>
                <td>{payment.amount}</td>
                <td>
                  <span className={`badge ${payment.status === "Completed" ? "bg-success" : "bg-warning"}`}>
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 💳 Payment Form */}
      <form onSubmit={handleSubmit} className="bg-light p-4 rounded shadow-sm">
        <h4 className="mb-3">Make a Payment</h4>

        <div className="mb-3">
          <label htmlFor="amount" className="form-label">Amount ($):</label>
          <input
            type="number"
            className="form-control"
            id="amount"
            name="amount"
            value={paymentDetails.amount}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="method" className="form-label">Payment Method:</label>
          <select
            className="form-select"
            id="method"
            name="method"
            value={paymentDetails.method}
            onChange={handleChange}
          >
            <option value="PayPal">PayPal</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <button type="submit" className="btn btn-success w-100">Confirm Payment</button>
      </form>
    </div>
  );
}

export default Payment;
