/**
 * ============================================================================
 * SUPABASE DATABASE CONFIGURATION & LOCAL FALLBACK STORE
 * ============================================================================
 * Description: Initializes the Supabase client when credentials are present.
 *              Provides a seamless in-memory database mock for local testing
 *              without needing an active internet/Supabase setup.
 * ============================================================================
 */

const { createClient } = require("@supabase/supabase-js");

// Read credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;

// Verify whether environment variables contain valid, non-placeholder credentials
const isConfigured =
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes("your-project-id") &&
  !supabaseServiceKey.includes("your-supabase");

// 1. Initialize real Supabase client if configured
if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("✅ Supabase client initialized with provided credentials.");
  } catch (err) {
    console.warn("⚠️ Failed to initialize Supabase client, falling back to local memory store:", err.message);
  }
}

// 2. Initialize in-memory mock database if credentials are missing
if (!supabase) {
  console.warn("⚠️ SUPABASE_URL and SUPABASE_SERVICE_KEY missing or placeholder. Running in local memory fallback mode.");

  // Storage structure matching database tables
  const inMemoryStore = {
    menu_items: [],
    admin_users: [],
    orders: [],
    feedback: [],
    contact_messages: [],
  };

  /**
   * Class: MockQueryBuilder
   * Replicates Supabase query builder syntax (select, insert, update, delete, eq, neq, order, limit).
   */
  class MockQueryBuilder {
    constructor(table) {
      this.table = table;
      if (!inMemoryStore[table]) inMemoryStore[table] = [];
      this.data = [...inMemoryStore[table]];
      this._select = true;
    }

    // Select query builder helper
    select(cols) {
      this._select = true;
      return this;
    }

    // Insert new record(s) into mock table
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

    // Update values helper
    update(values) {
      this.updateValues = values;
      return this;
    }

    // Delete flag helper
    delete() {
      this.isDelete = true;
      return this;
    }

    // Equality filter & update/delete trigger
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

    // Not-equal filter
    neq(col, val) {
      if (this.isDelete) {
        inMemoryStore[this.table] = inMemoryStore[this.table].filter((i) => i[col] == val);
        this.data = [];
      } else {
        this.data = this.data.filter((i) => i[col] != val);
      }
      return this;
    }

    // Search query helper stub
    or(condStr) {
      return this;
    }

    // Sort order helper
    order(col, opts = {}) {
      const asc = opts.ascending !== false;
      this.data.sort((a, b) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
      return this;
    }

    // Result limit helper
    limit(n) {
      this.data = this.data.slice(0, n);
      return this;
    }

    // Promise interface wrapper for async/await support
    then(resolve, reject) {
      resolve({ data: this.data, error: null });
    }
  }

  // Export mock client interface matching Supabase `.from()` syntax
  supabase = {
    from: (table) => new MockQueryBuilder(table),
  };
}

module.exports = supabase;
