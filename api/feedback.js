import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { name = "anonymous", message, concern = false } = req.body || {};
      if (!message || !String(message).trim()) return res.status(400).json({ error: "Message is required" });
      const rows = await sql`
        INSERT INTO feedback (name, message, concern) VALUES (${String(name).slice(0, 40)}, ${String(message).trim().slice(0, 2000)}, ${Boolean(concern)})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
