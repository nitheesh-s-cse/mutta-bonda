/* Run with: npm run seed or called automatically on server startup.
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

async function autoSeed() {
  try {
    const email = (process.env.ADMIN_EMAIL || "nitheeshsmart4316@gmail.com").toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "sollamaaten";

    // Check if admin users table has admin
    const { data: existingAdmin, error: adminQueryErr } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email);

    if (adminQueryErr) {
      console.warn("Auto-seed notice:", adminQueryErr.message);
      return;
    }

    if (!existingAdmin || existingAdmin.length === 0) {
      console.log("No admin found. Auto-seeding initial database data...");
      const password_hash = await bcrypt.hash(password, 10);
      const { error: adminInsertErr } = await supabase
        .from("admin_users")
        .insert([{ email, password_hash }]);

      if (!adminInsertErr) {
        console.log(`Created default admin account for ${email}`);
      }

      const { data: existingMenu } = await supabase.from("menu_items").select("id").limit(1);
      if (!existingMenu || existingMenu.length === 0) {
        const { data: insertedMenu } = await supabase.from("menu_items").insert(menu).select();
        if (insertedMenu) {
          console.log(`Inserted ${insertedMenu.length} initial menu items.`);
        }
      }
    }
  } catch (err) {
    console.error("Auto-seed failed:", err.message);
  }
}

if (require.main === module) {
  autoSeed().then(() => process.exit(0));
}

module.exports = { autoSeed };


