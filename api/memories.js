import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT m.*,
          COALESCE(
            json_object_agg(r.reaction, r.count) FILTER (WHERE r.reaction IS NOT NULL),
            '{}'::json
          ) AS reactions
        FROM memories m
        LEFT JOIN reactions r
          ON r.post_type = 'memory' AND r.post_id = m.id
        WHERE m.approved = true
        GROUP BY m.id
        ORDER BY m.created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { tag, name, message, image_url } = req.body || {};
      if (!message) return res.status(400).json({ error: "Caption/message is required" });

      const rows = await sql`
        INSERT INTO memories (tag, name, message, image_url, approved)
        VALUES (${tag || `#M-${Date.now()}`}, ${name || "anonymous"}, ${message}, ${image_url || null}, true)
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
