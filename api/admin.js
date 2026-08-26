import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const authorized = req => Boolean(process.env.ADMIN_KEY) && req.headers.authorization === `Bearer ${process.env.ADMIN_KEY}`;
const tableFor = kind => kind === "confession" ? "confessions" : kind === "memory" ? "memories" : null;

export default async function handler(req, res) {
  try {
    if (!authorized(req)) return res.status(401).json({ error: "Unauthorized" });
    if (req.method === "GET") {
      const [confessions, memories, feedback] = await Promise.all([
        sql`SELECT id, tag, name, message, created_at, 'confession' AS kind, NULL::text AS image_url FROM confessions WHERE approved = false ORDER BY created_at ASC`,
        sql`SELECT id, tag, name, message, image_url, created_at, 'memory' AS kind FROM memories WHERE approved = false ORDER BY created_at ASC`,
        sql`SELECT id, name, message, concern, created_at FROM feedback ORDER BY concern DESC, created_at DESC`
      ]);
      return res.status(200).json({ confessions, memories, feedback });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { action, kind, id } = req.body || {};
    const table = tableFor(kind);
    if (!table || !Number.isSafeInteger(Number(id))) return res.status(400).json({ error: "Invalid post" });
    if (action === "approve") {
      const prefix = kind === "memory" ? "M" : "CH";
      const rows = await sql.query(`UPDATE ${table} SET approved = true, tag = '#' || $1 || '-' || LPAD(id::text, 12, '0') WHERE id = $2 AND approved = false RETURNING *`, [prefix, Number(id)]);
      if (!rows.length) return res.status(404).json({ error: "Pending post not found" });
      return res.status(200).json({ success: true, post: rows[0] });
    }
    if (action === "delete") {
      await sql.query(`DELETE FROM ${table} WHERE id = $1`, [Number(id)]);
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (error) { console.error(error); return res.status(500).json({ error: error.message }); }
}
