const sendEmail = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');

/**
 * Sends one email via the existing sendEmail utility (which already reads
 * SMTP config from environment variables and no-ops gracefully if SMTP isn't
 * configured). Every public method below funnels through here so failure
 * handling and the returned shape are identical across all email types.
 */
const dispatch = async (to, { subject, html, text }) => {
  try {
    const result = await sendEmail({ to, subject, html, text });
    if (result.skipped) {
      return { success: false, skipped: true, error: 'SMTP not configured' };
    }
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error(`[emailService] Failed to send "${subject}" to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ============================================================
// Auth
// ============================================================

/**
 * @param {{ email: string, firstName: string, employeeId: string }} user
 * @param {{ loginUrl?: string }} [options]
 */
const sendWelcomeEmail = async (user, options = {}) => {
  const template = templates.welcomeEmailTemplate({
    firstName: user.firstName,
    employeeId: user.employeeId,
    loginUrl: options.loginUrl,
  });
  return dispatch(user.email, template);
};

/**
 * @param {{ email: string, firstName: string }} user
 * @param {string} resetUrl
 * @param {{ expiresInMinutes?: number }} [options]
 */
const sendPasswordResetEmail = async (user, resetUrl, options = {}) => {
  const template = templates.passwordResetEmailTemplate({
    firstName: user.firstName,
    resetUrl,
    expiresInMinutes: options.expiresInMinutes,
  });
  return dispatch(user.email, template);
};

// ============================================================
// Trip
// ============================================================

/**
 * @param {{ email: string, firstName: string }} user
 * @param {{ tripNumber: string, destination: string, dates: { startDate: Date, endDate: Date } }} trip
 * @param {{ tripUrl?: string }} [options]
 */
const sendTripApprovedEmail = async (user, trip, options = {}) => {
  const template = templates.tripApprovedEmailTemplate({
    firstName: user.firstName,
    tripNumber: trip.tripNumber,
    destination: trip.destination,
    startDate: new Date(trip.dates.startDate).toLocaleDateString(),
    endDate: new Date(trip.dates.endDate).toLocaleDateString(),
    tripUrl: options.tripUrl,
  });
  return dispatch(user.email, template);
};

/**
 * @param {{ email: string, firstName: string }} user
 * @param {{ tripNumber: string, destination: string }} trip
 * @param {string} reason
 * @param {{ tripUrl?: string }} [options]
 */
const sendTripRejectedEmail = async (user, trip, reason, options = {}) => {
  const template = templates.tripRejectedEmailTemplate({
    firstName: user.firstName,
    tripNumber: trip.tripNumber,
    destination: trip.destination,
    reason,
    tripUrl: options.tripUrl,
  });
  return dispatch(user.email, template);
};

// ============================================================
// Expense
// ============================================================

/**
 * @param {{ email: string, firstName: string }} user
 * @param {{ expenseNumber: string, category: string, amount: number, currency: string }} expense
 * @param {{ expenseUrl?: string }} [options]
 */
const sendExpenseApprovedEmail = async (user, expense, options = {}) => {
  const template = templates.expenseApprovedEmailTemplate({
    firstName: user.firstName,
    expenseNumber: expense.expenseNumber,
    category: expense.category,
    amount: expense.amount,
    currency: expense.currency,
    expenseUrl: options.expenseUrl,
  });
  return dispatch(user.email, template);
};

/**
 * @param {{ email: string, firstName: string }} user
 * @param {{ expenseNumber: string, category: string, amount: number, currency: string }} expense
 * @param {string} reason
 * @param {{ expenseUrl?: string }} [options]
 */
const sendExpenseRejectedEmail = async (user, expense, reason, options = {}) => {
  const template = templates.expenseRejectedEmailTemplate({
    firstName: user.firstName,
    expenseNumber: expense.expenseNumber,
    category: expense.category,
    amount: expense.amount,
    currency: expense.currency,
    reason,
    expenseUrl: options.expenseUrl,
  });
  return dispatch(user.email, template);
};

/**
 * @param {{ email: string, firstName: string }} user
 * @param {{ expenseNumber: string, amount: number, currency: string }} expense
 * @param {{ transactionReference?: string, expenseUrl?: string }} [options]
 */
const sendExpenseReimbursedEmail = async (user, expense, options = {}) => {
  const template = templates.expenseReimbursedEmailTemplate({
    firstName: user.firstName,
    expenseNumber: expense.expenseNumber,
    amount: expense.amount,
    currency: expense.currency,
    transactionReference: options.transactionReference,
    expenseUrl: options.expenseUrl,
  });
  return dispatch(user.email, template);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTripApprovedEmail,
  sendTripRejectedEmail,
  sendExpenseApprovedEmail,
  sendExpenseRejectedEmail,
  sendExpenseReimbursedEmail,
};
