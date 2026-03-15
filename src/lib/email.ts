const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || "ferienhaus@deinedomain.de";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) return;
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: recipients, subject, html }),
    });
  } catch (err) {
    console.error("E-Mail konnte nicht gesendet werden:", err);
  }
}

export function bookingEmailHtml(title: string, body: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Ferienhaus Flims</h1>
      </div>
      <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
        <h2 style="color:#1e293b;margin-top:0">${title}</h2>
        <p style="color:#475569;line-height:1.6">${body}</p>
        <a href="${process.env.NEXTAUTH_URL}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:6px">
          Zur App
        </a>
      </div>
    </div>
  `;
}
