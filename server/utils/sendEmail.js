const nodemailer = require('nodemailer');
const { smtp } = require('../config/env');

let transporter;

/**
 * Lazily creates a single reusable SMTP transporter instead of one per call.
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });
  }
  return transporter;
};

/**
 * Generic send helper. Intentionally free of any specific auth-flow content
 * (no verification/reset templates) - callers pass the subject/body they need.
 *
 * @param {{ to: string, subject: string, text?: string, html?: string }} options
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!smtp.user || !smtp.pass) {
    // Fail soft in local/dev environments where SMTP isn't configured yet,
    // rather than blocking core auth flows like registration.
    console.warn(`[sendEmail] SMTP not configured - skipped email to ${to}: "${subject}"`);
    return { skipped: true };
  }

  const info = await getTransporter().sendMail({
    from: smtp.from,
    to,
    subject,
    text,
    html,
  });

  return { skipped: false, messageId: info.messageId };
};

module.exports = sendEmail;
