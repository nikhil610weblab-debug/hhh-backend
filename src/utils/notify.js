// Thin notification layer: SMS via Twilio, email via SendGrid or SES.
//
// Every function is safe to call with missing config or a missing
// recipient — it logs and resolves to { skipped: true, reason } instead of
// throwing, so a notification failure never breaks the request that
// triggered it (e.g. don't fail "create message" just because SendGrid is
// down). Callers should fire-and-forget these (`.catch(() => {})` or just
// don't await) unless they specifically need to know delivery succeeded.

let twilioClient = null;
function getTwilioClient() {
  if (twilioClient) return twilioClient;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  const twilio = require("twilio");
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

// sendSms(to, body) -> { skipped, sid? , reason? }
async function sendSms(to, body) {
  if (!to) return { skipped: true, reason: "no recipient phone number" };

  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_FROM_NUMBER) {
    console.log(`[notify:sms:skipped] to=${to} body="${body}"`);
    return { skipped: true, reason: "Twilio not configured" };
  }

  try {
    const message = await client.messages.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER,
      body,
    });
    return { skipped: false, sid: message.sid };
  } catch (error) {
    console.error("[notify:sms:error]", error.message);
    return { skipped: true, reason: error.message };
  }
}

let sendgridReady = false;
function getSendgrid() {
  if (!process.env.SENDGRID_API_KEY) return null;
  const sgMail = require("@sendgrid/mail");
  if (!sendgridReady) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendgridReady = true;
  }
  return sgMail;
}

async function sendEmailViaSendgrid({ to, subject, text, html }) {
  const sgMail = getSendgrid();
  if (!sgMail) return { skipped: true, reason: "SendGrid not configured" };

  await sgMail.send({
    to,
    from: process.env.EMAIL_FROM,
    subject,
    text,
    ...(html ? { html } : {}),
  });
  return { skipped: false };
}

let sesClient = null;
function getSesClient() {
  if (sesClient) return sesClient;
  if (!process.env.AWS_REGION) return null;
  const { SESClient } = require("@aws-sdk/client-ses");
  sesClient = new SESClient({ region: process.env.AWS_REGION });
  return sesClient;
}

async function sendEmailViaSes({ to, subject, text, html }) {
  const client = getSesClient();
  if (!client) return { skipped: true, reason: "SES not configured" };

  const { SendEmailCommand } = require("@aws-sdk/client-ses");
  const command = new SendEmailCommand({
    Source: process.env.EMAIL_FROM,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Text: { Data: text },
        ...(html ? { Html: { Data: html } } : {}),
      },
    },
  });
  await client.send(command);
  return { skipped: false };
}

// sendEmail({ to, subject, text, html? }) -> { skipped, reason? }
// Provider is chosen with EMAIL_PROVIDER=sendgrid|ses. Falls back to a
// console log (no-op) if unset, so local dev never needs real credentials.
async function sendEmail({ to, subject, text, html }) {
  if (!to) return { skipped: true, reason: "no recipient email" };
  if (!process.env.EMAIL_FROM) {
    console.log(`[notify:email:skipped] to=${to} subject="${subject}"`);
    return { skipped: true, reason: "EMAIL_FROM not configured" };
  }

  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  try {
    if (provider === "ses") return await sendEmailViaSes({ to, subject, text, html });
    if (provider === "sendgrid") return await sendEmailViaSendgrid({ to, subject, text, html });
    console.log(`[notify:email:skipped] to=${to} subject="${subject}" (EMAIL_PROVIDER not set)`);
    return { skipped: true, reason: "EMAIL_PROVIDER not set" };
  } catch (error) {
    console.error("[notify:email:error]", error.message);
    return { skipped: true, reason: error.message };
  }
}

module.exports = { sendSms, sendEmail };