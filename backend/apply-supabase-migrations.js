// Apply Supabase migrations using explicit connection parameters
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Connection details from your Supabase project
const config = {
  host: "db.wkhnhvppcjvfqnokbnvc.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "Nammadhaaa@4316",
  ssl: { rejectUnauthorized: false }
};

async function applyMigrations() {
  const client = new Client(config);
  await client.connect();
  console.log("Connected to Supabase database");

  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    console.log(`Applying ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    try {
      await client.query(sql);
      console.log(`  ✓ ${file} applied`);
    } catch (err) {
      console.error(`  ✗ ${file} failed:`, err.message);
    }
  }

  await client.end();
  console.log("Done!");
}

applyMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});