const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;

const isConfigured =
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes("your-project-id") &&
  !supabaseServiceKey.includes("your-supabase");

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client initialized with provided credentials.");
  } catch (err) {
    console.warn("Failed to initialize Supabase client, falling back to local memory store:", err.message);
  }
}

if (!supabase) {
  console.warn("⚠️ SUPABASE_URL and SUPABASE_SERVICE_KEY missing or placeholder. Running in local memory fallback mode.");

  // Simple in-memory storage fallback for local development without Supabase
  const inMemoryStore = {
    menu_items: [],
    admin_users: [],
    orders: [],
    feedback: [],
    contact_messages: [],
  };

  class MockQueryBuilder {
    constructor(table) {
      this.table = table;
      if (!inMemoryStore[table]) inMemoryStore[table] = [];
      this.data = [...inMemoryStore[table]];
      this._select = true;
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
      // Basic support for search
      return this;
    }

    order(col, opts = {}) {
      const asc = opts.ascending !== false;
      this.data.sort((a, b) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
      return this;
    }

    limit(n) {
      this.data = this.data.slice(0, n);
      return this;
    }

    then(resolve, reject) {
      resolve({ data: this.data, error: null });
    }
  }

  supabase = {
    from: (table) => new MockQueryBuilder(table),
  };
}

module.exports = supabase;