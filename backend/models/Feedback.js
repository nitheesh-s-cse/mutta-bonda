const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    visitDate: { type: Date },
    favouriteItem: { type: String, default: "" },
    foodQuality: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
      default: "Good",
    },
    ratings: {
      overall: { type: Number, min: 0, max: 5, default: 0 },
      taste: { type: Number, min: 0, max: 5, default: 0 },
      price: { type: Number, min: 0, max: 5, default: 0 },
      staff: { type: Number, min: 0, max: 5, default: 0 },
      cleanliness: { type: Number, min: 0, max: 5, default: 0 },
    },
    visitAgain: { type: String, enum: ["Yes", "Maybe", "No"], default: "Yes" },
    recommend: { type: String, enum: ["Yes", "Maybe", "No"], default: "Yes" },
    suggestions: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
