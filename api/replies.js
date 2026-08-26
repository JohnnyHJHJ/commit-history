import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const validType = type => ["confession", "memory"].includes(type);

async function ensureRepliesTable() {
  await sql`CREATE TABLE IF NOT EXISTS replies (
    id BIGSERIAL PRIMARY KEY, post_type TEXT NOT NULL, post_id BIGINT NOT NULL,
    name TEXT NOT NULL DEFAULT 'anonymous', message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export default async function handler(req, res) {
  try {
    await ensureRepliesTable();
    const source = req.method === "GET" ? req.query : req.body;
    const { post_type, post_id } = source || {};
    if (!validType(post_type) || !Number.isSafeInteger(Number(post_id))) return res.status(400).json({ error: "Invalid post" });
    if (req.method === "GET") {
      const rows = await sql`SELECT id, name, message, created_at FROM replies WHERE post_type = ${post_type} AND post_id = ${Number(post_id)} ORDER BY created_at ASC`;
      return res.status(200).json(rows);
    }
    if (req.method === "POST") {
      const { name = "anonymous", message } = req.body || {};
      if (!String(message || "").trim()) return res.status(400).json({ error: "Reply is required" });
      const rows = await sql`INSERT INTO replies (post_type, post_id, name, message) VALUES (${post_type}, ${Number(post_id)}, ${String(name).trim().slice(0,40)}, ${String(message).trim().slice(0,1000)}) RETURNING id, name, message, created_at`;
      return res.status(201).json(rows[0]);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) { console.error(error); return res.status(500).json({ error: error.message }); }
}
