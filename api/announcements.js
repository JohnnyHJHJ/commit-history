import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const ADMIN_KEY = process.env.ADMIN_KEY || "";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM announcements ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${ADMIN_KEY}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "POST") {
      const { title, body, author } = req.body || {};
      if (!title || !body) return res.status(400).json({ error: "Title and body are required" });
      const [row] = await sql`
        INSERT INTO announcements (title, body, author)
        VALUES (${title.trim().slice(0, 200)}, ${body.trim().slice(0, 2000)}, ${(author || "Admin").trim().slice(0, 40)})
        RETURNING *
      `;
      return res.status(201).json(row);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || isNaN(Number(id))) return res.status(400).json({ error: "Valid ID required" });
      await sql`DELETE FROM announcements WHERE id = ${Number(id)}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
