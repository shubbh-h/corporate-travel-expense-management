const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ActivityLog vs AuditLog:
 * - AuditLog records sensitive, state-changing actions with before/after values,
 *   intended for compliance review and is relatively low-volume.
 * - ActivityLog records *every* user interaction (logins, page views, searches,
 *   exports, form submissions) for usage analytics and session reconstruction.
 *   It is high-volume and does not track field-level value changes.
 */
const activityLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },

    activityType: {
      type: String,
      enum: [
        'login',
        'logout',
        'login_failed',
        'page_view',
        'trip_created',
        'trip_updated',
        'trip_cancelled',
        'expense_submitted',
        'expense_updated',
        'receipt_uploaded',
        'profile_updated',
        'password_changed',
        'search_performed',
        'filter_applied',
        'report_exported',
        'notification_viewed',
        'other',
      ],
      required: [true, 'Activity type is required'],
    },

    description: { type: String, trim: true },

    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    device: {
      type: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
      os: String,
      browser: String,
    },

    sessionId: { type: String, trim: true },

    // Freeform contextual payload, e.g. { searchQuery: 'Mumbai', resultsCount: 12 }
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ============================================================
// Indexes
// ============================================================
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ activityType: 1, createdAt: -1 });
activityLogSchema.index({ sessionId: 1 });
// Auto-purge activity logs after 180 days to keep this high-volume collection lean.
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
