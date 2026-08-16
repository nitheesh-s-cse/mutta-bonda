/* Run with: npm run seed
   Populates Supabase database with the starting menu and one admin account. */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const supabase = require("./config/supabase");

const menu = [
  { name: "Chicken Mutta Bonda", price: 60, category: "Special Bonda", is_todays_special: true, tag: "Best Seller" },
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
  console.log("Seeding Supabase...");

  // Delete existing items
  const { error: delErr } = await supabase.from("menu_items").delete().neq("id", 0);
  if (delErr) console.warn("Notice during menu clear:", delErr.message);

  // Insert menu
  const { data: insertedMenu, error: menuErr } = await supabase
    .from("menu_items")
    .insert(menu)
    .select();

  if (menuErr) throw menuErr;
  console.log(`Inserted ${insertedMenu.length} menu items.`);

  const email = (process.env.ADMIN_EMAIL || "owner@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "changeme123";

  // Check if admin exists
  const { data: existingAdmin, error: adminQueryErr } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email);

  if (adminQueryErr) throw adminQueryErr;

  if (!existingAdmin || existingAdmin.length === 0) {
    const password_hash = await bcrypt.hash(password, 10);
    const { error: adminInsertErr } = await supabase
      .from("admin_users")
      .insert([{ email, password_hash }]);

    if (adminInsertErr) throw adminInsertErr;
    console.log(`Created admin account for ${email}.`);
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

