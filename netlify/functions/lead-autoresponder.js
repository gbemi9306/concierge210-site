// Triggered by a Netlify Forms "Outgoing webhook" notification on the "intake" form.
// Sends the lead an instant autoresponder, emails Toyin an internal notice with a
// "mark as handled" link, and stores the lead in Netlify Blobs for the 2-day follow-up check.
//
// One-time setup needed (see SETUP.md):
//   1. RESEND_API_KEY and FROM_EMAIL env vars set in Netlify site settings.
//   2. Site settings → Forms → Form notifications → Add notification → Outgoing webhook
//      → Form: intake → URL: https://concierge210.com/.netlify/functions/lead-autoresponder

const { getStore } = require("@netlify/blobs");
const { sendEmail } = require("./_resend");
const { autoresponder, internalNotice, EMAIL } = require("./_email-templates");

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Netlify's outgoing webhook sends the submission at the top level (data, form_name, id, ...).
  const data = payload.data || (payload.payload && payload.payload.data) || {};
  const submissionId = payload.id || (payload.payload && payload.payload.id) || randomId();

  const lead = {
    id: submissionId,
    submitted_at: new Date().toISOString(),
    service: data.service || "",
    name: data.name || "",
    phone: data.phone || "",
    email: data.email || "",
    preferred_contact: data.preferred_contact || "",
    relationship_to_parent: data.relationship_to_parent || "",
    parent_address: data.parent_address || "",
    has_pets: data.has_pets || "",
    checkin_tier: data.checkin_tier || "",
    move_date: data.move_date || "",
    family_size: data.family_size || "",
    movein_tier: data.movein_tier || "",
    details: data.details || "",
  };

  const siteUrl = process.env.URL || "https://concierge210.com";
  const markHandledUrl = `${siteUrl}/.netlify/functions/mark-handled?id=${encodeURIComponent(lead.id)}`;

  const results = { autoresponder: "skipped", internalNotice: "skipped", stored: false };

  // 1. Instant autoresponder to the lead (only possible if they gave an email).
  if (lead.email) {
    try {
      const msg = autoresponder(lead);
      await sendEmail({ to: lead.email, subject: msg.subject, html: msg.html, text: msg.text, replyTo: EMAIL });
      results.autoresponder = "sent";
    } catch (e) {
      results.autoresponder = `error: ${e.message}`;
    }
  }

  // 2. Internal notice to Toyin with the mark-handled link.
  try {
    const admin = process.env.ADMIN_EMAIL || EMAIL;
    const msg = internalNotice(lead, markHandledUrl);
    await sendEmail({ to: admin, subject: msg.subject, html: msg.html, text: msg.text, replyTo: lead.email || undefined });
    results.internalNotice = "sent";
  } catch (e) {
    results.internalNotice = `error: ${e.message}`;
  }

  // 3. Store for the scheduled follow-up check.
  try {
    const store = getStore("leads");
    await store.setJSON(lead.id, { ...lead, sent_followup: false, handled: false });
    results.stored = true;
  } catch (e) {
    results.stored = `error: ${e.message}`;
  }

  return { statusCode: 200, body: JSON.stringify(results) };
};
