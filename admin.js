import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

function authorized(req) {
  const key = process.env.ADMIN_KEY;

  if (!key) return false;

  return req.headers.authorization === `Bearer ${key}`;
}

export default async function handler(req, res) {
  try {
    if (!authorized(req)) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    if (req.method === "GET") {
      const [confessions, memories] = await Promise.all([
        sql`
          SELECT
            id,
            tag,
            name,
            message,
            created_at,
            'confession' AS kind,
            NULL AS image_url
          FROM confessions
          WHERE approved = false
          ORDER BY created_at ASC
        `,
        sql`
          SELECT
            id,
            tag,
            name,
            message,
            image_url,
            created_at,
            'memory' AS kind
          FROM memories
          WHERE approved = false
          ORDER BY created_at ASC
        `
      ]);

      const queue = [...confessions, ...memories]
        .sort((a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
        );

      return res.status(200).json(queue);
    }

    if (req.method === "POST") {
      const {
        action,
        kind,
        id
      } = req.body || {};

      if (!action || !kind || !id) {
        return res.status(400).json({
          error: "action, kind, and id are required"
        });
      }

      const table =
        kind === "memory"
          ? "memories"
          : kind === "confession"
            ? "confessions"
            : null;

      if (!table) {
        return res.status(400).json({
          error: "Invalid post type"
        });
      }

      if (action === "reject") {
        await sql.query(
          `DELETE FROM ${table} WHERE id = $1 AND approved = false`,
          [Number(id)]
        );

        return res.status(200).json({
          success: true
        });
      }

      if (action === "approve") {
        const prefix = kind === "memory" ? "M" : "CH";

        const rows = await sql.query(
          `
          UPDATE ${table}
          SET
            approved = true,
            tag = '#' || $1 || '-' ||
              LPAD(id::text, 12, '0')
          WHERE id = $2
            AND approved = false
          RETURNING *
          `,
          [prefix, Number(id)]
        );

        if (!rows.length) {
          return res.status(404).json({
            error: "Pending post not found"
          });
        }

        return res.status(200).json({
          success: true,
          post: rows[0]
        });
      }

      return res.status(400).json({
        error: "Invalid moderation action"
      });
    }

    return res.status(405).json({
      error: "Method not allowed"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
