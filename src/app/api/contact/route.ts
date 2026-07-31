import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TARGET_EMAIL = "quiznptelskylashtechog@gmail.com";

type ContactInput = {
  name: string;
  email: string;
  role: string;
  subject: string;
  message: string;
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function messageBody(input: ContactInput) {
  return [
    "Contact form submission",
    "",
    `Name: ${input.name || "Not provided"}`,
    `Email: ${input.email || "Not provided"}`,
    `Role: ${input.role || "Not provided"}`,
    `Subject: ${input.subject || "Not provided"}`,
    "",
    "Message:",
    input.message,
  ].join("\n");
}

function composeUrl(input: ContactInput) {
  const subject = `[Contact Form] ${input.subject || "New message from Quiz Nptel Skylashtechog"}`;
  return `https://mail.google.com/mail/u/0/?view=cm&to=${encodeURIComponent(TARGET_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody(input))}`;
}

async function ensureContactTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id serial PRIMARY KEY,
      name text,
      email text,
      role text,
      subject text,
      message text NOT NULL,
      status text NOT NULL DEFAULT 'new',
      sent_to text NOT NULL,
      delivery_mode text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
}

function getGmailCredentials() {
  const user =
    process.env.CONTACT_GMAIL_USER?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    "";
  const pass = (
    process.env.CONTACT_GMAIL_APP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    ""
  ).replace(/\s+/g, "");
  return { user, pass };
}

async function sendDirect(input: ContactInput): Promise<{ sent: boolean; error?: string }> {
  const { user: smtpUser, pass: smtpPassword } = getGmailCredentials();
  if (!smtpUser || !smtpPassword) {
    return { sent: false, error: "Gmail SMTP credentials are not configured." };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPassword },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: `"Quiz Nptel Skylashtechog Contact" <${smtpUser}>`,
      to: TARGET_EMAIL,
      replyTo: input.email || smtpUser,
      subject: `[Contact Form] ${input.subject || input.name || "New message"}`,
      text: messageBody(input),
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;padding:8px">
          <h2 style="color:#ea580c">New Quiz Nptel Skylashtechog contact message</h2>
          <p><b>Name:</b> ${escapeHtml(input.name) || "—"}</p>
          <p><b>Email:</b> ${escapeHtml(input.email) || "—"}</p>
          <p><b>Role:</b> ${escapeHtml(input.role) || "—"}</p>
          <p><b>Subject:</b> ${escapeHtml(input.subject) || "—"}</p>
          <div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px">${escapeHtml(input.message)}</div>
        </div>`,
    });
    console.log(`[contact] Gmail delivered: ${info.messageId}`);
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gmail error";
    console.error(`[contact] Gmail delivery failed: ${message}`);
    return { sent: false, error: message };
  }
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as Record<string, unknown>;
    if (raw.company) return NextResponse.json({ ok: true, sentDirectly: false });

    const input: ContactInput = {
      name: text(raw.name, 120),
      email: text(raw.email, 180).toLowerCase(),
      role: text(raw.role, 80),
      subject: text(raw.subject, 160),
      message: text(raw.message, 12_000),
    };

    if (!input.name || !input.email || input.message.length < 5) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    await ensureContactTable();

    const [stored] = await db
      .insert(contactMessages)
      .values({
        name: input.name,
        email: input.email,
        role: input.role || null,
        subject: input.subject || null,
        message: input.message,
        status: "sending",
        sentTo: TARGET_EMAIL,
        deliveryMode: "gmail-smtp",
      })
      .returning({ id: contactMessages.id });

    const delivery = await sendDirect(input);

    await db
      .update(contactMessages)
      .set({
        status: delivery.sent ? "sent" : "new",
        deliveryMode: delivery.sent ? "direct-gmail" : "stored-and-gmail-link",
      })
      .where(eq(contactMessages.id, stored.id));

    return NextResponse.json({
      ok: true,
      stored: true,
      sentDirectly: delivery.sent,
      gmailUrl: delivery.sent ? null : composeUrl(input),
      destination: TARGET_EMAIL,
      deliveryError: delivery.sent ? null : delivery.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the message.";
    console.error(`[contact] submission error: ${message}`);
    return NextResponse.json({ error: "Unable to save the message. Please try again." }, { status: 500 });
  }
}
