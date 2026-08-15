const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    category: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: "Pickup at shop" },
    paymentMethod: { type: String, default: "Cash" },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    delivery: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Preparing", "Delivered", "Rejected"],
      default: "Pending",
    },
    specialInstructions: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
