import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS announcement_replies (id BIGSERIAL PRIMARY KEY, announcement_id BIGINT NOT NULL, name TEXT NOT NULL DEFAULT 'anonymous', message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
}

export default async function handler(req, res) {
  try {
    await ensureTable();
    const source = req.method === "GET" ? req.query : req.body;
    const id = Number(source?.announcement_id);
    if (!Number.isSafeInteger(id)) return res.status(400).json({ error: "Valid announcement required" });
    if (req.method === "GET") return res.status(200).json(await sql`SELECT id, name, message, created_at FROM announcement_replies WHERE announcement_id = ${id} ORDER BY created_at ASC`);
    if (req.method === "POST") {
      const message = String(req.body?.message || "").trim();
      if (!message) return res.status(400).json({ error: "Message is required" });
      const [row] = await sql`INSERT INTO announcement_replies (announcement_id, name, message) VALUES (${id}, ${String(req.body?.name || "anonymous").trim().slice(0, 40)}, ${message.slice(0, 2000)}) RETURNING *`;
      return res.status(201).json(row);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}
