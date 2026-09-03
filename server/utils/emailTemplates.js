/**
 * Reusable HTML email templates for TripWise.
 *
 * Every builder below returns { subject, html, text } and does no I/O itself -
 * actual sending happens in services/emailService.js via the existing
 * utils/sendEmail.js transporter. Keeping these as pure functions makes them
 * trivial to unit test and reuse outside the email service if ever needed.
 */

const BRAND_COLOR = '#1e3a8a'; // navy, matches an enterprise travel/expense platform
const APP_NAME = 'TripWise';

/**
 * Shared table-based HTML skeleton (inline styles, no external CSS/JS) so the
 * email renders consistently across clients like Outlook and Gmail. Every
 * specific template below supplies its own `bodyHtml` and optional CTA button.
 */
const wrapTemplate = ({ title, bodyHtml, ctaLabel, ctaUrl }) => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background-color:${BRAND_COLOR}; padding:20px 32px;">
                <span style="color:#ffffff; font-size:20px; font-weight:bold;">${APP_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px; color:#111827; font-size:20px;">${title}</h2>
                <div style="color:#374151; font-size:14px; line-height:1.6;">${bodyHtml}</div>
                ${
                  ctaUrl
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                        <tr>
                          <td style="background-color:${BRAND_COLOR}; border-radius:6px;">
                            <a href="${ctaUrl}" style="display:inline-block; padding:12px 24px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:bold;">${ctaLabel}</a>
                          </td>
                        </tr>
                      </table>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; border-top:1px solid #e5e7eb;">
                <p style="margin:0; color:#9ca3af; font-size:12px;">This is an automated message from ${APP_NAME}. Please do not reply to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

// ============================================================
// Auth
// ============================================================

const welcomeEmailTemplate = ({ firstName, employeeId, loginUrl }) => ({
  subject: `Welcome to ${APP_NAME}, ${firstName}!`,
  html: wrapTemplate({
    title: `Welcome aboard, ${firstName}!`,
    bodyHtml: `
      <p>Your ${APP_NAME} account has been created successfully.</p>
      <p><strong>Employee ID:</strong> ${employeeId}</p>
      <p>You can now log in to submit travel requests, file expenses, and track approvals.</p>
    `,
    ctaLabel: 'Log In',
    ctaUrl: loginUrl,
  }),
  text: `Welcome to ${APP_NAME}, ${firstName}! Your account (Employee ID: ${employeeId}) has been created. Log in at: ${loginUrl || ''}`,
});

const passwordResetEmailTemplate = ({ firstName, resetUrl, expiresInMinutes = 30 }) => ({
  subject: `${APP_NAME} Password Reset Request`,
  html: wrapTemplate({
    title: 'Reset your password',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your ${APP_NAME} password. This link expires in ${expiresInMinutes} minutes.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl,
  }),
  text: `Hi ${firstName}, reset your password using this link (expires in ${expiresInMinutes} minutes): ${resetUrl}`,
});

// ============================================================
// Trip
// ============================================================

const tripApprovedEmailTemplate = ({ firstName, tripNumber, destination, startDate, endDate, tripUrl }) => ({
  subject: `Trip Approved: ${destination} (${tripNumber})`,
  html: wrapTemplate({
    title: 'Your trip has been approved',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>Your trip request to <strong>${destination}</strong> has been approved.</p>
      <p><strong>Trip ID:</strong> ${tripNumber}<br/>
      <strong>Dates:</strong> ${startDate} - ${endDate}</p>
    `,
    ctaLabel: 'View Trip',
    ctaUrl: tripUrl,
  }),
  text: `Hi ${firstName}, your trip to ${destination} (${tripNumber}, ${startDate} - ${endDate}) has been approved.`,
});

const tripRejectedEmailTemplate = ({ firstName, tripNumber, destination, reason, tripUrl }) => ({
  subject: `Trip Rejected: ${destination} (${tripNumber})`,
  html: wrapTemplate({
    title: 'Your trip request was rejected',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>Your trip request to <strong>${destination}</strong> (${tripNumber}) has been rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
    `,
    ctaLabel: 'View Trip',
    ctaUrl: tripUrl,
  }),
  text: `Hi ${firstName}, your trip to ${destination} (${tripNumber}) was rejected. Reason: ${reason}`,
});

// ============================================================
// Expense
// ============================================================

const expenseApprovedEmailTemplate = ({ firstName, expenseNumber, category, amount, currency, expenseUrl }) => ({
  subject: `Expense Approved: ${expenseNumber}`,
  html: wrapTemplate({
    title: 'Your expense has been approved',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>Your ${category} expense of <strong>${amount} ${currency}</strong> (${expenseNumber}) has been approved by Finance.</p>
    `,
    ctaLabel: 'View Expense',
    ctaUrl: expenseUrl,
  }),
  text: `Hi ${firstName}, your ${category} expense of ${amount} ${currency} (${expenseNumber}) has been approved.`,
});

const expenseRejectedEmailTemplate = ({ firstName, expenseNumber, category, amount, currency, reason, expenseUrl }) => ({
  subject: `Expense Rejected: ${expenseNumber}`,
  html: wrapTemplate({
    title: 'Your expense was rejected',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>Your ${category} expense of <strong>${amount} ${currency}</strong> (${expenseNumber}) has been rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
    `,
    ctaLabel: 'View Expense',
    ctaUrl: expenseUrl,
  }),
  text: `Hi ${firstName}, your ${category} expense of ${amount} ${currency} (${expenseNumber}) was rejected. Reason: ${reason}`,
});

const expenseReimbursedEmailTemplate = ({ firstName, expenseNumber, amount, currency, transactionReference, expenseUrl }) => ({
  subject: `Expense Reimbursed: ${expenseNumber}`,
  html: wrapTemplate({
    title: 'Your expense has been reimbursed',
    bodyHtml: `
      <p>Hi ${firstName},</p>
      <p>Your expense of <strong>${amount} ${currency}</strong> (${expenseNumber}) has been reimbursed.</p>
      ${transactionReference ? `<p><strong>Transaction reference:</strong> ${transactionReference}</p>` : ''}
    `,
    ctaLabel: 'View Expense',
    ctaUrl: expenseUrl,
  }),
  text: `Hi ${firstName}, your expense of ${amount} ${currency} (${expenseNumber}) has been reimbursed.${transactionReference ? ` Reference: ${transactionReference}` : ''}`,
});

module.exports = {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  tripApprovedEmailTemplate,
  tripRejectedEmailTemplate,
  expenseApprovedEmailTemplate,
  expenseRejectedEmailTemplate,
  expenseReimbursedEmailTemplate,
};
