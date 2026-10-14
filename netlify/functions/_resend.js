// Thin wrapper around Resend's REST API (https://resend.com) — no SDK dependency needed.
// Requires env var RESEND_API_KEY. FROM_EMAIL should be an address on a domain verified in Resend
// (falls back to Resend's shared test sender, which only works for low-volume testing).

async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set in this site's environment variables.");
  }
  const from = process.env.FROM_EMAIL || "Concierge210 <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
  return res.json();
}

module.exports = { sendEmail };
