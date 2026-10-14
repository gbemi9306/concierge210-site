// Scheduled daily (see netlify.toml) — sends the follow-up email to any lead that's
// 2+ days old, hasn't been marked handled, and hasn't already received a follow-up.
// Also clears out leads older than 30 days to keep the store small.

const { getStore } = require("@netlify/blobs");
const { sendEmail } = require("./_resend");
const { followup, EMAIL } = require("./_email-templates");

const FOLLOWUP_AFTER_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const CLEANUP_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

exports.handler = async () => {
  const store = getStore("leads");
  const { blobs } = await store.list();

  const now = Date.now();
  const report = { checked: 0, sent: 0, skipped: 0, cleaned: 0, errors: [] };

  for (const { key } of blobs) {
    report.checked += 1;
    let lead;
    try {
      lead = await store.get(key, { type: "json" });
    } catch (e) {
      report.errors.push(`${key}: read failed (${e.message})`);
      continue;
    }
    if (!lead) continue;

    const submittedAt = new Date(lead.submitted_at).getTime();
    const age = now - submittedAt;

    // Clean up old entries regardless of state.
    if (age > CLEANUP_AFTER_MS) {
      await store.delete(key);
      report.cleaned += 1;
      continue;
    }

    if (lead.handled || lead.sent_followup || !lead.email) {
      report.skipped += 1;
      continue;
    }

    if (age >= FOLLOWUP_AFTER_MS) {
      try {
        const msg = followup(lead);
        await sendEmail({ to: lead.email, subject: msg.subject, html: msg.html, text: msg.text, replyTo: EMAIL });
        await store.setJSON(key, { ...lead, sent_followup: true });
        report.sent += 1;
      } catch (e) {
        report.errors.push(`${key}: send failed (${e.message})`);
      }
    } else {
      report.skipped += 1;
    }
  }

  return { statusCode: 200, body: JSON.stringify(report) };
};
