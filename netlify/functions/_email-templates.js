// Shared email copy for the lead-automation functions.
// Keep this in sync with the "Concierge210 — Client Templates" doc if you change the wording there.

const BUSINESS_NAME = "Concierge210";
const PHONE = "(720) 557-5541";
const PHONE_TEL = "+17205575541";
const EMAIL = "concierge210tx@gmail.com";

function firstName(fullName) {
  if (!fullName) return "there";
  return String(fullName).trim().split(/\s+/)[0];
}

function serviceLabel(service) {
  if (!service) return "your situation";
  return service.toLowerCase().includes("move") ? "move-in concierge" : "check-in & coordination";
}

// Sent immediately when the intake form is submitted.
function autoresponder(lead) {
  const name = firstName(lead.name);
  const service = serviceLabel(lead.service);
  const isMoveIn = service === "move-in concierge";

  const subject = `Got it, ${name} — here's what happens next`;

  const bodyLines = [
    `Hi ${name},`,
    ``,
    `Thanks for reaching out to ${BUSINESS_NAME} about ${service}. This confirms I received your info.`,
    ``,
    `Here's what happens next: I'll personally review what you sent and reach out within 24 hours — by ${lead.preferred_contact ? lead.preferred_contact.toLowerCase() : "phone or email"} — to set up a free 15-minute call. ${isMoveIn ? "We'll go over your move timeline and what you need handled first." : "We'll go over your parent's situation and which tier makes sense."}`,
    ``,
    `If anything is urgent in the meantime, call or text me directly at ${PHONE}.`,
    ``,
    `Talk soon,`,
    `Toyin Solarin`,
    `${BUSINESS_NAME} — San Antonio, TX`,
  ];

  const text = bodyLines.join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#211E1B;max-width:480px">
    ${bodyLines.map(l => l === "" ? "<br/>" : `<p style="margin:0 0 8px">${l}</p>`).join("\n")}
  </div>`;

  return { subject, text, html };
}

// Sent a couple of days later if the lead hasn't been marked handled.
function followup(lead) {
  const name = firstName(lead.name);
  const service = serviceLabel(lead.service);

  const subject = `Still want to talk, ${name}?`;

  const bodyLines = [
    `Hi ${name},`,
    ``,
    `Just following up on your note about ${service} — I don't want it to get lost. I still have time for a free 15-minute call this week if you'd like to talk through it.`,
    ``,
    `No pressure either way. You can reply to this email, or call/text me at ${PHONE} whenever works for you.`,
    ``,
    `Toyin Solarin`,
    `${BUSINESS_NAME} — San Antonio, TX`,
  ];

  const text = bodyLines.join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#211E1B;max-width:480px">
    ${bodyLines.map(l => l === "" ? "<br/>" : `<p style="margin:0 0 8px">${l}</p>`).join("\n")}
  </div>`;

  return { subject, text, html };
}

// Internal notification to Toyin with a one-click "skip the follow-up" link.
function internalNotice(lead, markHandledUrl) {
  const subject = `New ${serviceLabel(lead.service)} lead: ${lead.name || "unknown"}`;
  const rows = Object.entries(lead)
    .filter(([k]) => !["id", "submitted_at"].includes(k))
    .map(([k, v]) => `<tr><td style="padding:2px 8px 2px 0;color:#514C43">${k}</td><td style="padding:2px 0">${v || "—"}</td></tr>`)
    .join("\n");

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#211E1B">
    <p>New lead submitted the intake form:</p>
    <table>${rows}</table>
    <p style="margin-top:16px">Already handled this one (booked, called, or not a fit)? Click below to cancel the automatic 2-day follow-up email:</p>
    <p><a href="${markHandledUrl}" style="color:#9A4530">Mark as handled — skip follow-up</a></p>
  </div>`;

  const text = `New lead: ${lead.name}\n${JSON.stringify(lead, null, 2)}\n\nMark handled (skip follow-up): ${markHandledUrl}`;

  return { subject, text, html };
}

module.exports = { BUSINESS_NAME, PHONE, PHONE_TEL, EMAIL, autoresponder, followup, internalNotice };
