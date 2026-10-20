/**
 * ============================================================================
 * SUPABASE DATABASE CONFIGURATION & RESILIENT FALLBACK STORE
 * ============================================================================
 * Description: Initializes the Supabase client when credentials are valid.
 *              Provides seamless automatic in-memory fallback if Supabase
 *              is paused, unreachable, or has network DNS failures
 *              (e.g., TypeError: fetch failed / ENOTFOUND).
 * ============================================================================
 */

const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

// Read credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Default admin credentials
const defaultEmail = (process.env.ADMIN_EMAIL || "nitheeshsmart4316@gmail.com").toLowerCase();
const defaultPass = process.env.ADMIN_PASSWORD || "sollamaaten";
let defaultPasswordHash = "";
try {
  defaultPasswordHash = bcrypt.hashSync(defaultPass, 10);
} catch (e) {
  defaultPasswordHash = "$2a$10$wK1b8Nlmq4hFw6J183K8l.8n7tH4E9/5j3O3A7C.Q8Vq6zW4mE7u6";
}

// Default menu items for in-memory fallback
const initialMenuItems = [
  { id: 1, name: "Chicken Mutta Bonda", price: 60, category: "Special Bonda", is_todays_special: true, tag: "Best Seller", is_available: true, display_order: 1, image_url: "assets/images/chicken_mutta_bonda.jpg" },
  { id: 2, name: "Kaara Bonda", price: 20, category: "Veg Bonda", is_available: true, display_order: 2, image_url: "assets/images/kaara_bonda.jpg" },
  { id: 3, name: "Keerai Bonda", price: 20, category: "Veg Bonda", is_available: true, display_order: 3, image_url: "assets/images/keerai_bonda.jpg" },
  { id: 4, name: "Murunga Keerai Bonda", price: 25, category: "Veg Bonda", is_available: true, display_order: 4, image_url: "assets/images/murunga_keerai_bonda.jpg" },
  { id: 5, name: "Thandu Keerai Bonda", price: 25, category: "Veg Bonda", is_available: true, display_order: 5, image_url: "assets/images/thandu_keerai_bonda.jpg" },
  { id: 6, name: "Paneer Bonda", price: 35, category: "Veg Bonda", is_available: true, display_order: 6, image_url: "assets/images/paneer_bonda.jpg" },
  { id: 7, name: "Cheese Bonda", price: 40, category: "Veg Bonda", is_available: true, display_order: 7, image_url: "assets/images/cheese_bonda.jpg" },
  { id: 8, name: "Beef Bonda", price: 55, category: "Non-Veg Bonda", is_available: true, display_order: 8, image_url: "assets/images/beef_bonda.jpg" },
  { id: 9, name: "Mutton Bonda", price: 65, category: "Non-Veg Bonda", is_available: true, display_order: 9, image_url: "assets/images/mutton_bonda.jpg" },
  { id: 10, name: "Normal Tea", price: 10, category: "Tea", is_available: true, display_order: 10, image_url: "assets/images/normal_tea.jpg" },
  { id: 11, name: "Ginger Tea", price: 12, category: "Tea", is_available: true, display_order: 11, image_url: "assets/images/ginger_tea.jpg" },
  { id: 12, name: "Black Tea", price: 10, category: "Tea", is_available: true, display_order: 12, image_url: "assets/images/black_tea.jpg" },
  { id: 13, name: "Masala Tea", price: 15, category: "Tea", is_available: true, display_order: 13, image_url: "assets/images/masala_tea.jpg" },
  { id: 14, name: "Green Tea", price: 15, category: "Tea", is_available: true, display_order: 14, image_url: "assets/images/green_tea.jpg" },
  { id: 15, name: "Filter Coffee", price: 15, category: "Coffee", is_available: true, display_order: 15, image_url: "assets/images/filter_coffee.jpg" },
  { id: 16, name: "Bru Coffee", price: 15, category: "Coffee", is_available: true, display_order: 16, image_url: "assets/images/bru_coffee.jpg" },
  { id: 17, name: "Cold Coffee", price: 40, category: "Coffee", is_available: true, display_order: 17, image_url: "assets/images/cold_coffee.jpg" },
  { id: 18, name: "Boost", price: 20, category: "Coffee", is_available: true, display_order: 18, image_url: "assets/images/boost.jpg" },
  { id: 19, name: "Horlicks", price: 20, category: "Coffee", is_available: true, display_order: 19, image_url: "assets/images/horlicks.jpg" },
  { id: 20, name: "Badam Milk", price: 30, category: "Coffee", is_available: true, display_order: 20, image_url: "assets/images/badam_milk.jpg" },
  { id: 21, name: "Mint Juice", price: 25, category: "Juices", is_available: true, display_order: 21, image_url: "assets/images/mint_juice.jpg" },
  { id: 22, name: "Lemon Mint", price: 25, category: "Juices", is_available: true, display_order: 22, image_url: "assets/images/lemon_mint.jpg" },
  { id: 23, name: "Watermelon Juice", price: 30, category: "Juices", is_available: true, display_order: 23, image_url: "assets/images/watermelon_juice.jpg" },
  { id: 24, name: "Mosambi Juice", price: 30, category: "Juices", is_available: true, display_order: 24, image_url: "assets/images/mosambi_juice.jpg" },
  { id: 25, name: "Fresh Lime Soda", price: 20, category: "Juices", is_available: true, display_order: 25, image_url: "assets/images/fresh_lime_soda.jpg" },
  { id: 26, name: "Kaara Bonda + Chicken Mutta Bonda (Free Tea)", price: 80, category: "Combo", is_available: true, display_order: 26, image_url: "assets/images/chicken_mutta_bonda.jpg" },
  { id: 27, name: "Family Bonda Combo (Free Coke + Cupcake)", price: 200, category: "Combo", is_available: true, display_order: 27, image_url: "assets/images/chicken_mutta_bonda.jpg" },
];

// In-memory data store for resilient local fallback
const inMemoryStore = {
  menu_items: [...initialMenuItems],
  admin_users: [
    { id: 1, email: defaultEmail, password_hash: defaultPasswordHash, name: "Vijaykumar" }
  ],
  orders: [],
  feedback: [],
  contact_messages: [],
};

/**
 * Class: MockQueryBuilder
 * Replicates Supabase PostgREST query builder syntax for in-memory operations.
 */
class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    if (!inMemoryStore[table]) inMemoryStore[table] = [];
    this.data = [...inMemoryStore[table]];
    this._select = true;
    this._single = false;
    this.updateValues = null;
    this.isDelete = false;
  }

  select(cols) {
    this._select = true;
    return this;
  }

  insert(rows) {
    const items = Array.isArray(rows) ? rows : [rows];
    const inserted = items.map((r, i) => ({
      id: r.id || inMemoryStore[this.table].length + i + 1,
      created_at: r.created_at || new Date().toISOString(),
      ...r,
    }));
    inMemoryStore[this.table].push(...inserted);
    this.data = inserted;
    return this;
  }

  update(values) {
    this.updateValues = values;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(col, val) {
    if (this.updateValues) {
      inMemoryStore[this.table].forEach((item) => {
        if (item[col] == val) Object.assign(item, this.updateValues);
      });
      this.data = inMemoryStore[this.table].filter((i) => i[col] == val);
    } else if (this.isDelete) {
      inMemoryStore[this.table] = inMemoryStore[this.table].filter((i) => i[col] != val);
      this.data = [];
    } else {
      this.data = this.data.filter((i) => i[col] == val);
    }
    return this;
  }

  neq(col, val) {
    if (this.isDelete) {
      inMemoryStore[this.table] = inMemoryStore[this.table].filter((i) => i[col] == val);
      this.data = [];
    } else {
      this.data = this.data.filter((i) => i[col] != val);
    }
    return this;
  }

  or(condStr) {
    if (typeof condStr === "string" && condStr.includes(".ilike.")) {
      const match = condStr.match(/%([^%]+)%/);
      if (match && match[1]) {
        const term = match[1].toLowerCase();
        this.data = this.data.filter((item) => {
          return (
            (item.customer_name && String(item.customer_name).toLowerCase().includes(term)) ||
            (item.phone && String(item.phone).toLowerCase().includes(term)) ||
            (item.name && String(item.name).toLowerCase().includes(term))
          );
        });
      }
    }
    return this;
  }

  order(col, opts = {}) {
    const asc = opts.ascending !== false;
    this.data.sort((a, b) => {
      const valA = a[col] != null ? a[col] : 0;
      const valB = b[col] != null ? b[col] : 0;
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(n) {
    this.data = this.data.slice(0, n);
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  then(resolve, reject) {
    const resultData = this._single ? (this.data[0] || null) : this.data;
    resolve({ data: resultData, error: null });
  }
}

// Verify whether environment variables contain valid, non-placeholder credentials
const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseServiceKey) &&
  !supabaseUrl.includes("your-project-id") &&
  !supabaseServiceKey.includes("your-supabase");

let realClient = null;
let isSupabaseHealthy = null; // null = untried, true = healthy, false = unreachable

if (isConfigured) {
  try {
    realClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log("📡 Initialized Supabase client with environment credentials.");
  } catch (err) {
    console.warn("⚠️ Failed to initialize Supabase client instance:", err.message);
  }
} else {
  console.log("ℹ️ SUPABASE_URL not configured. Running in high-performance in-memory mode.");
}

/**
 * Helper to determine if an error is a network connectivity/DNS failure.
 */
function isNetworkError(err) {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("no such host") ||
    msg.includes("invalid api key") ||
    msg.includes("jwt") ||
    msg.includes("apikey") ||
    msg.includes("bad gateway") ||
    msg.includes("service unavailable") ||
    msg.includes("paused")
  );
}

/**
 * Class: ResilientQueryBuilder
 * Proxies calls to real Supabase, but seamlessly falls back to the in-memory mock
 * if the database is paused, offline, or returns network fetch failures.
 */
class ResilientQueryBuilder {
  constructor(table) {
    this.table = table;
    this.mockBuilder = new MockQueryBuilder(table);
    this.realBuilder = (realClient && isSupabaseHealthy !== false) ? realClient.from(table) : null;
  }

  select(...args) {
    this.mockBuilder.select(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.select(...args);
    return this;
  }

  insert(...args) {
    this.mockBuilder.insert(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.insert(...args);
    return this;
  }

  update(...args) {
    this.mockBuilder.update(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.update(...args);
    return this;
  }

  delete(...args) {
    this.mockBuilder.delete(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.delete(...args);
    return this;
  }

  eq(...args) {
    this.mockBuilder.eq(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.eq(...args);
    return this;
  }

  neq(...args) {
    this.mockBuilder.neq(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.neq(...args);
    return this;
  }

  or(...args) {
    this.mockBuilder.or(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.or(...args);
    return this;
  }

  order(...args) {
    this.mockBuilder.order(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.order(...args);
    return this;
  }

  limit(...args) {
    this.mockBuilder.limit(...args);
    if (this.realBuilder) this.realBuilder = this.realBuilder.limit(...args);
    return this;
  }

  single(...args) {
    this.mockBuilder.single(...args);
    if (this.realBuilder && typeof this.realBuilder.single === "function") {
      this.realBuilder = this.realBuilder.single(...args);
    }
    return this;
  }

  async then(resolve, reject) {
    if (this.realBuilder && isSupabaseHealthy !== false) {
      try {
        const result = await this.realBuilder;
        if (result && result.error && isNetworkError(result.error)) {
          if (isSupabaseHealthy !== false) {
            console.warn(`⚠️ Supabase network error on '${this.table}' (${result.error.message}). Switching to resilient in-memory fallback.`);
          }
          isSupabaseHealthy = false;
          return this.mockBuilder.then(resolve, reject);
        }

        // Successfully executed against real Supabase
        if (isSupabaseHealthy === false) {
          console.log("✅ Supabase connection restored!");
        }
        isSupabaseHealthy = true;
        return resolve(result);
      } catch (err) {
        if (isNetworkError(err)) {
          if (isSupabaseHealthy !== false) {
            console.warn(`⚠️ Supabase fetch exception on '${this.table}'. Switching to resilient in-memory fallback.`);
          }
          isSupabaseHealthy = false;
          return this.mockBuilder.then(resolve, reject);
        }
        return resolve({ data: null, error: err });
      }
    }

    return this.mockBuilder.then(resolve, reject);
  }
}

// Background connectivity check to automatically recover when Supabase unpauses
if (realClient) {
  setInterval(async () => {
    if (isSupabaseHealthy === false) {
      try {
        const { error } = await realClient.from("admin_users").select("id").limit(1);
        if (!error || !isNetworkError(error)) {
          console.log("✅ Supabase cloud database is reachable again! Reconnecting...");
          isSupabaseHealthy = true;
        }
      } catch (e) {
        // Still down, keep in-memory fallback active
      }
    }
  }, 45000).unref();
}

const supabase = {
  from: (table) => new ResilientQueryBuilder(table),
};

module.exports = supabase;