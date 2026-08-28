import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const ADMIN_KEY = process.env.ADMIN_KEY || "";
const SUBJECTS = ["CS 10", "CS 11", "CS 30", "Math 21"];

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM tests ORDER BY date ASC, created_at DESC`;
      return res.status(200).json(rows);
    }

    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${ADMIN_KEY}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "POST") {
      const { subject, date, description } = req.body || {};
      if (!subject || !date || !description) return res.status(400).json({ error: "All fields required" });
      if (!SUBJECTS.includes(subject)) return res.status(400).json({ error: "Invalid subject" });
      const [row] = await sql`
        INSERT INTO tests (subject, date, description)
        VALUES (${subject}, ${date}, ${description.trim().slice(0, 200)})
        RETURNING *
      `;
      return res.status(201).json(row);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || isNaN(Number(id))) return res.status(400).json({ error: "Valid ID required" });
      await sql`DELETE FROM tests WHERE id = ${Number(id)}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
