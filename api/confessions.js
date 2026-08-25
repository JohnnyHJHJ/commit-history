import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT c.*,
          COALESCE(
            json_object_agg(r.reaction, r.count) FILTER (WHERE r.reaction IS NOT NULL),
            '{}'::json
          ) AS reactions
        FROM confessions c
        LEFT JOIN reactions r
          ON r.post_type = 'confession' AND r.post_id = c.id
        WHERE c.approved = true
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { tag, name, message, image_url } = req.body || {};
      if (!message) return res.status(400).json({ error: "Message is required" });

      const rows = await sql`
        INSERT INTO confessions (tag, name, message, image_url, approved)
        VALUES (${tag || `#CH-${Date.now()}`}, ${name || "anonymous"}, ${message}, ${image_url || null}, true)
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
