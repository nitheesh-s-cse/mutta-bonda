/* Run with: npm run seed
   Populates the database with the starting menu and one admin account. */
require("dotenv").config();
const connectDB = require("./config/db");
const MenuItem = require("./models/MenuItem");
const Admin = require("./models/Admin");

const menu = [
  { name: "Chicken Mutta Bonda", price: 60, category: "Special Bonda", isTodaysSpecial: true, badges: ["Best Seller", "Chef Special", "Most Ordered"] },
  { name: "Kaara Bonda", price: 20, category: "Veg Bonda" },
  { name: "Keerai Bonda", price: 20, category: "Veg Bonda" },
  { name: "Murunga Keerai Bonda", price: 25, category: "Veg Bonda" },
  { name: "Thandu Keerai Bonda", price: 25, category: "Veg Bonda" },
  { name: "Paneer Bonda", price: 35, category: "Veg Bonda" },
  { name: "Cheese Bonda", price: 40, category: "Veg Bonda" },
  { name: "Beef Bonda", price: 55, category: "Non-Veg Bonda" },
  { name: "Mutton Bonda", price: 65, category: "Non-Veg Bonda" },
  { name: "Normal Tea", price: 10, category: "Tea" },
  { name: "Ginger Tea", price: 12, category: "Tea" },
  { name: "Black Tea", price: 10, category: "Tea" },
  { name: "Masala Tea", price: 15, category: "Tea" },
  { name: "Green Tea", price: 15, category: "Tea" },
  { name: "Filter Coffee", price: 15, category: "Coffee" },
  { name: "Bru Coffee", price: 15, category: "Coffee" },
  { name: "Cold Coffee", price: 40, category: "Coffee" },
  { name: "Boost", price: 20, category: "Coffee" },
  { name: "Horlicks", price: 20, category: "Coffee" },
  { name: "Badam Milk", price: 30, category: "Coffee" },
  { name: "Mint Juice", price: 25, category: "Juices" },
  { name: "Lemon Mint", price: 25, category: "Juices" },
  { name: "Watermelon Juice", price: 30, category: "Juices" },
  { name: "Mosambi Juice", price: 30, category: "Juices" },
  { name: "Fresh Lime Soda", price: 20, category: "Juices" },
  { name: "Kaara Bonda + Chicken Mutta Bonda (Free Tea)", price: 80, category: "Combo" },
  { name: "Family Bonda Combo (Free Coke + Cupcake)", price: 200, category: "Combo" },
];

async function seed() {
  await connectDB();

  await MenuItem.deleteMany({});
  await MenuItem.insertMany(menu);
  console.log(`Inserted ${menu.length} menu items.`);

  const email = (process.env.ADMIN_EMAIL || "owner@example.com").toLowerCase();
  const existingAdmin = await Admin.findOne({ email });
  if (!existingAdmin) {
    await Admin.create({
      email,
      password: process.env.ADMIN_PASSWORD || "changeme123",
      name: "Vijaykumar",
    });
    console.log(`Created admin account for ${email}. Change this password after first login.`);
  } else {
    console.log("Admin account already exists — skipped.");
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
