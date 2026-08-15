const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ["Special Bonda", "Veg Bonda", "Non-Veg Bonda", "Tea", "Coffee", "Juices", "Combo"],
    },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    isTodaysSpecial: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    badges: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
