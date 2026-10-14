# Lead automation setup (one-time)

This adds two things once it's wired up:
1. **Instant autoresponder** — the lead gets an email the moment they submit the intake form.
2. **Automatic follow-up** — if they haven't been marked "handled," they get a gentle nudge 2 days later. A link in your own notification email lets you cancel that follow-up with one click once you've actually talked to them.

Everything in `netlify/functions/` is already built and pushed. These are the steps only you can do, because they need your own accounts:

## 1. Create a free Resend account (sends the emails)
- Go to resend.com and sign up free (3,000 emails/month, 100/day — plenty for this).
- Verify your sending domain (`concierge210.com`) under Domains → Add Domain. Resend gives you a few DNS records (TXT/MX) to add.
- Since concierge210.com's DNS is on Cloudflare, send me those records and I'll add them for you — or add them yourself in Cloudflare → DNS.
- Until the domain is verified, you can test with `FROM_EMAIL` left unset (it falls back to Resend's shared test sender), but set the real domain before relying on this for live leads — unverified senders land in spam more often.
- Once verified, create an API key under API Keys → Create API Key.

## 2. Add environment variables in Netlify
Site settings → Environment variables → Add a variable:
- `RESEND_API_KEY` = the key from step 1
- `FROM_EMAIL` = `Concierge210 <hello@concierge210.com>` (or whatever address you verified)
- `ADMIN_EMAIL` = `concierge210tx@gmail.com` (optional — defaults to this anyway; set it if you ever want notices to go somewhere else)

Redeploy the site after adding these (Netlify does this automatically on the next deploy, or trigger one manually under Deploys → Trigger deploy).

## 3. Connect the form to the function
Site settings → Forms → Form notifications → Add notification → **Outgoing webhook**
- Form: `intake`
- URL to notify: `https://concierge210.com/.netlify/functions/lead-autoresponder`

This is separate from (and in addition to) the email notification you already have set up for new submissions landing in your inbox.

## That's it
The daily follow-up check (`send-followups`) runs automatically once deployed — no setup needed beyond the env vars above. It checks once a day, so a follow-up might go out anywhere from 2–3 days after the original inquiry, not at an exact hour.

### Testing
Submit the intake form yourself with your own email address. You should get the autoresponder within a minute, and a notice at concierge210tx@gmail.com with a "mark as handled" link. To test the follow-up without waiting 2 days, you can temporarily lower `FOLLOWUP_AFTER_MS` in `send-followups.js` and trigger the function manually from the Netlify Functions tab.
