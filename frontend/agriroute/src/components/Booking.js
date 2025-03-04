import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap is loaded
import "./../styles/booking.css";

const mockBookings = [
  { id: 1, product: "Blueberries", quantity: "50kg", date: "2025-03-10" },
  { id: 2, product: "Strawberries", quantity: "30kg", date: "2025-03-12" },
];

function Booking() {
  const [bookingDetails, setBookingDetails] = useState({
    product: "",
    quantity: "",
    date: "",
  });
  const [submitted, setSubmitted] = useState(false); // Track submission

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails({ ...bookingDetails, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true); // Show success message
    setTimeout(() => setSubmitted(false), 3000); // Hide after 3 seconds
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center booking-title">Booking Page</h2>

      {/* Success Message */}
      {submitted && (
        <div className="alert alert-success text-center">
          Booking successfully submitted!
        </div>
      )}

      {/* Static List of Bookings (Styled as Table) */}
      <div className="mb-4">
        <h4 className="text-secondary">Existing Bookings</h4>
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Pick-up Date</th>
            </tr>
          </thead>
          <tbody>
            {mockBookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.product}</td>
                <td>{booking.quantity}</td>
                <td>{booking.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="bg-light p-4 rounded shadow">
        <div className="mb-3">
          <label htmlFor="product" className="form-label fw-bold">Product:</label>
          <input
            type="text"
            className="form-control"
            id="product"
            name="product"
            value={bookingDetails.product}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="quantity" className="form-label fw-bold">Quantity (kg):</label>
          <input
            type="number"
            className="form-control"
            id="quantity"
            name="quantity"
            value={bookingDetails.quantity}
            onChange={handleChange}
            min="1"
            placeholder="Enter quantity"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="date" className="form-label fw-bold">Pick-up Date:</label>
          <input
            type="date"
            className="form-control"
            id="date"
            name="date"
            value={bookingDetails.date}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-success w-100">Submit Booking</button>
      </form>
    </div>
  );
}

export default Booking;
