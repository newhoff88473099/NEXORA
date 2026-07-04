#!/usr/bin/env node
// Executar: node db/migrate.js
// Requer DATABASE_URL em .env.local

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "\n❌  DATABASE_URL não encontrado em .env.local\n\n" +
    "Adicione a linha abaixo ao .env.local:\n\n" +
    "  DATABASE_URL=postgresql://postgres.[ref]:[senha]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres\n\n" +
    "Obtenha o valor em:\n" +
    "  Supabase Dashboard → Settings → Database → Connection string (URI)\n" +
    "  (marque 'Session mode' e substitua [YOUR-PASSWORD] pela sua senha)\n"
  );
  process.exit(1);
}

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });

  console.log("Conectando ao banco de dados...");
  await client.connect();
  console.log("✓ Conectado");

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (file.startsWith("0000_")) continue; // pular arquivos de seed/test
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`\nExecutando ${file}...`);
    try {
      await client.query(sql);
      console.log(`✓ ${file} executado com sucesso`);
    } catch (err) {
      console.error(`❌ Erro em ${file}:\n${err.message}`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("\n✅  Migrations concluídas com sucesso!\n");
}

run().catch((err) => {
  console.error("Erro inesperado:", err.message);
  process.exit(1);
});
