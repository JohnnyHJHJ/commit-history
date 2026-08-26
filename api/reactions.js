import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { post_type, post_id } = req.query || {};
      if (!post_type || !post_id) {
        return res.status(400).json({ error: "post_type and post_id are required" });
      }

      const rows = await sql`
        SELECT reaction, count
        FROM reactions
        WHERE post_type = ${post_type} AND post_id = ${Number(post_id)}
      `;

      const reactions = Object.fromEntries(rows.map(r => [r.reaction, r.count]));
      return res.status(200).json({ reactions });
    }

    if (req.method === "POST") {
      const { post_type, post_id, reaction, action = "add" } = req.body || {};

      if (!post_type || !post_id || !reaction) {
        return res.status(400).json({
          error: "post_type, post_id, and reaction are required"
        });
      }
      if (!["confession", "memory"].includes(post_type) || !["add", "remove"].includes(action)) {
        return res.status(400).json({ error: "Invalid reaction request" });
      }

      if (action === "remove") {
        await sql`
          UPDATE reactions SET count = GREATEST(count - 1, 0)
          WHERE post_type = ${post_type} AND post_id = ${Number(post_id)} AND reaction = ${reaction}
        `;
        await sql`
          DELETE FROM reactions
          WHERE post_type = ${post_type} AND post_id = ${Number(post_id)} AND reaction = ${reaction} AND count <= 0
        `;
      } else {
      await sql`
        INSERT INTO reactions (post_type, post_id, reaction, count)
        VALUES (${post_type}, ${Number(post_id)}, ${reaction}, 1)
        ON CONFLICT (post_type, post_id, reaction)
        DO UPDATE SET count = reactions.count + 1
        RETURNING reaction, count
      `;
      }

      const all = await sql`
        SELECT reaction, count
        FROM reactions
        WHERE post_type = ${post_type} AND post_id = ${Number(post_id)}
      `;

      const reactions = Object.fromEntries(all.map(r => [r.reaction, r.count]));
      return res.status(200).json({ reactions });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
