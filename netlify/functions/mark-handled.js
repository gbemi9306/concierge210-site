// Visited from the "mark as handled" link in the internal lead notice email.
// Flags a lead so the scheduled follow-up skips it. GET /.netlify/functions/mark-handled?id=<leadId>

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) {
    return { statusCode: 400, body: "Missing ?id=" };
  }

  const store = getStore("leads");
  const lead = await store.get(id, { type: "json" });

  if (!lead) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/html" },
      body: `<p style="font-family:Arial,sans-serif">Couldn't find that lead (it may already have been cleaned up).</p>`,
    };
  }

  await store.setJSON(id, { ...lead, handled: true });

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `<p style="font-family:Arial,sans-serif">Marked ${lead.name || id} as handled — the follow-up email is cancelled.</p>`,
  };
};
