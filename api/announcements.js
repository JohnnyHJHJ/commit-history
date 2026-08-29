import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const ADMIN_KEY = process.env.ADMIN_KEY || "";
const VALID_COLORS = ["cream", "pink", "mint", "sky", "amber", "lavender"];

async function ensureAnnouncementFields() {
  await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'NORMAL'`;
  await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT 'General'`;
  await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'cream'`;
}

export default async function handler(req, res) {
  try {
    await ensureAnnouncementFields();
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM announcements WHERE COALESCE(published, true) = true ORDER BY COALESCE(pinned, false) DESC, created_at DESC`;
      return res.status(200).json(rows);
    }

    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${ADMIN_KEY}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "POST") {
      const { title, body, author, subject = "General", priority = "NORMAL", pinned = false, published = true, color = "cream" } = req.body || {};
      if (!title || !body) return res.status(400).json({ error: "Title and body are required" });
      const [row] = await sql`
        INSERT INTO announcements (title, body, author, subject, priority, pinned, published, color)
        VALUES (${title.trim().slice(0, 200)}, ${body.trim().slice(0, 5000)}, ${(author || "Admin").trim().slice(0, 40)}, ${String(subject).trim().slice(0, 80) || "General"}, ${["NORMAL", "IMPORTANT", "URGENT"].includes(priority) ? priority : "NORMAL"}, ${Boolean(pinned)}, ${Boolean(published)}, ${VALID_COLORS.includes(color) ? color : "cream"})
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

    if (req.method === "PATCH") {
      const { id, title, body, author, subject, priority, pinned, published, color } = req.body || {};
      if (!Number.isSafeInteger(Number(id))) return res.status(400).json({ error: "Valid ID required" });
      const [row] = await sql`UPDATE announcements SET
        title = COALESCE(${title ? String(title).trim().slice(0, 200) : null}, title),
        body = COALESCE(${body ? String(body).trim().slice(0, 2000) : null}, body),
        author = COALESCE(${author ? String(author).trim().slice(0, 40) : null}, author),
        subject = COALESCE(${subject ? String(subject).trim().slice(0, 80) : null}, subject),
        priority = COALESCE(${["NORMAL", "IMPORTANT", "URGENT"].includes(priority) ? priority : null}, priority),
        pinned = COALESCE(${typeof pinned === "boolean" ? pinned : null}, pinned),
        published = COALESCE(${typeof published === "boolean" ? published : null}, published),
        color = COALESCE(${VALID_COLORS.includes(color) ? color : null}, color),
        updated_at = NOW() WHERE id = ${Number(id)} RETURNING *`;
      return row ? res.status(200).json(row) : res.status(404).json({ error: "Announcement not found" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
