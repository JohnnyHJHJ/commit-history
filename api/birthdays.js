import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await sql`SELECT id, name, birthday FROM birthdays ORDER BY EXTRACT(MONTH FROM birthday), EXTRACT(DAY FROM birthday), name`;
      return res.status(200).json(rows);
    }
    if (req.method === "POST") {
      const { name, birthday, visitor_id } = req.body || {};
      if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(String(birthday)) || !visitor_id) return res.status(400).json({ error: "Name and birthday are required" });
      const rows = await sql`INSERT INTO birthdays (name, birthday, visitor_id) VALUES (${String(name).trim().slice(0,40)}, ${birthday}, ${String(visitor_id).slice(0,100)}) ON CONFLICT (visitor_id) DO NOTHING RETURNING id, name, birthday`;
      if (!rows.length) return res.status(409).json({ error: "A birthday was already submitted from this browser" });
      return res.status(201).json(rows[0]);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) { console.error(error); return res.status(500).json({ error: error.message }); }
}
