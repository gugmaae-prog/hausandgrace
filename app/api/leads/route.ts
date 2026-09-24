import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";

const LEAD_NOTIFICATION_RECIPIENT = "keifferjapeth@outlook.com";
const LEAD_NOTIFICATION_SENDER = "website@hausandgrace.ae";
const RATE_LIMIT_MAX = 5;
const MAX_BODY_BYTES = 20_000;

type LeadPayload = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
  propertyReference?: string;
  propertyTitle?: string;
  consent?: string | boolean;
  website?: string;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replaceAll("\0", "").trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function isValidPhone(phone: string) {
  return /^[+\d][\d\s().-]{5,39}$/.test(phone);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function enforceRateLimit(request: Request) {
  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
  const key = `website-lead:${await sha256(clientIp)}`;
  const row = await env.DB.prepare(
    `INSERT INTO hg_agent_rate_limits ("key", window_started_at, "count")
     VALUES (?, CURRENT_TIMESTAMP, 1)
     ON CONFLICT("key") DO UPDATE SET
       "count" = CASE
         WHEN datetime(window_started_at, '+15 minutes') <= CURRENT_TIMESTAMP THEN 1
         ELSE "count" + 1
       END,
       window_started_at = CASE
         WHEN datetime(window_started_at, '+15 minutes') <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP
         ELSE window_started_at
       END
     RETURNING "count"`,
  ).bind(key).first<{ count: number }>();
  if ((row?.count ?? RATE_LIMIT_MAX + 1) > RATE_LIMIT_MAX) {
    throw new Error("rate_limited");
  }
}

function leadNotification({
  id,
  createdAt,
  name,
  email,
  phone,
  message,
  source,
  propertyReference,
  propertyTitle,
}: {
  id: number;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  propertyReference: string | null;
  propertyTitle: string;
}) {
  const projectUrl = propertyReference
    ? `https://hausandgrace.ae/projects/${encodeURIComponent(propertyReference)}`
    : "https://hausandgrace.ae";
  const subjectContext = propertyTitle || propertyReference || "website";
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    phone: escapeHtml(phone),
    message: escapeHtml(message || "No additional message").replaceAll("\n", "<br>"),
    source: escapeHtml(source),
    property: escapeHtml(propertyTitle || propertyReference || "General enquiry"),
    projectUrl: escapeHtml(projectUrl),
    createdAt: escapeHtml(createdAt),
  };
  return {
    subject: `New website enquiry — ${subjectContext.slice(0, 80)}`,
    html: `<!doctype html>
<html><body style="margin:0;background:#f0ebe1;color:#191a18;font-family:Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0ebe1">
    <tr><td align="center" style="padding:36px 18px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#faf8f3;border-top:4px solid #d8b66a">
        <tr><td style="padding:42px 42px 18px">
          <p style="margin:0 0 24px;color:#8a6a33;font-size:11px;font-weight:700;letter-spacing:2.5px">HAUS &amp; GRACE · WEBSITE ENQUIRY</p>
          <h1 style="margin:0 0 10px;font-family:Georgia,serif;font-size:32px;font-weight:400;line-height:1.15">${safe.property}</h1>
          <p style="margin:0;color:#777269;font-size:13px">Lead #${id} · ${safe.createdAt}</p>
        </td></tr>
        <tr><td style="padding:18px 42px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding:12px 0;border-bottom:1px solid #ded8cc;color:#8a6a33;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Name</td><td style="padding:12px 0;border-bottom:1px solid #ded8cc;text-align:right">${safe.name}</td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #ded8cc;color:#8a6a33;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Email</td><td style="padding:12px 0;border-bottom:1px solid #ded8cc;text-align:right"><a href="mailto:${safe.email}" style="color:#191a18">${safe.email}</a></td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #ded8cc;color:#8a6a33;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Phone</td><td style="padding:12px 0;border-bottom:1px solid #ded8cc;text-align:right"><a href="tel:${safe.phone}" style="color:#191a18">${safe.phone}</a></td></tr>
            <tr><td style="padding:12px 0;color:#8a6a33;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Source</td><td style="padding:12px 0;text-align:right">${safe.source}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:12px 42px 28px">
          <p style="margin:0 0 8px;color:#8a6a33;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Client message</p>
          <p style="margin:0;line-height:1.7">${safe.message}</p>
        </td></tr>
        <tr><td style="padding:0 42px 42px">
          <a href="${safe.projectUrl}" style="display:inline-block;padding:15px 22px;background:#191a18;color:#d8b66a;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Open project page</a>
          <p style="margin:18px 0 0;color:#777269;font-size:12px">Reply to this email to contact ${safe.name} directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    text: [
      "HAUS & GRACE website enquiry",
      `Lead #${id}`,
      `Received: ${createdAt}`,
      `Project: ${propertyTitle || propertyReference || "General enquiry"}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Source: ${source}`,
      `Message: ${message || "No additional message"}`,
      `Project page: ${projectUrl}`,
    ].join("\n"),
  };
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return Response.json({ error: "Enquiry is too large." }, { status: 413 });
    }

    const payload = (await request.json()) as LeadPayload;
    if (clean(payload.website, 200)) return Response.json({ ok: true }, { status: 201 });

    try {
      await enforceRateLimit(request);
    } catch {
      return Response.json({ error: "Please wait before sending another enquiry." }, { status: 429 });
    }

    const name = clean(payload.name, 100);
    const email = clean(payload.email, 160).toLowerCase();
    const phone = clean(payload.phone, 40);
    const message = clean(payload.message, 2000);
    const source = clean(payload.source, 80) || "website";
    const propertyReference = clean(payload.propertyReference, 100) || null;
    const propertyTitle = clean(payload.propertyTitle, 160);
    const consent = payload.consent === "yes" || payload.consent === true;
    if (name.length < 2 || !isValidEmail(email) || !isValidPhone(phone) || !consent) {
      return Response.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    const db = await getDb();
    const [lead] = await db.insert(leads).values({
      name,
      email,
      phone,
      message,
      source,
      propertyReference,
      consent,
    }).returning({ id: leads.id, createdAt: leads.createdAt });

    if (!env.EMAIL) {
      await db.update(leads).set({ status: "notification_failed" }).where(eq(leads.id, lead.id));
      return Response.json({ error: "The advisory desk is temporarily unavailable." }, { status: 503 });
    }

    const notification = leadNotification({
      ...lead,
      name,
      email,
      phone,
      message,
      source,
      propertyReference,
      propertyTitle,
    });
    try {
      const result = await env.EMAIL.send({
        to: LEAD_NOTIFICATION_RECIPIENT,
        from: { email: LEAD_NOTIFICATION_SENDER, name: "HAUS & GRACE Website" },
        replyTo: { email, name },
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      });
      await db.update(leads).set({ status: "notified" }).where(eq(leads.id, lead.id));
      console.log(JSON.stringify({ event: "lead_notification_sent", leadId: lead.id, messageId: result.messageId }));
      return Response.json({ ok: true, lead: { id: lead.id, createdAt: lead.createdAt } }, { status: 201 });
    } catch (error) {
      await db.update(leads).set({ status: "notification_failed" }).where(eq(leads.id, lead.id));
      console.error(JSON.stringify({
        event: "lead_notification_failed",
        leadId: lead.id,
        message: error instanceof Error ? error.message.slice(0, 300) : "Email delivery failed",
      }));
      return Response.json({ error: "The enquiry was saved, but the advisory desk could not be notified." }, { status: 502 });
    }
  } catch (error) {
    console.error(JSON.stringify({
      event: "lead_submission_failed",
      message: error instanceof Error ? error.message.slice(0, 300) : "Unable to save enquiry",
    }));
    return Response.json({ error: "Unable to process enquiry." }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
