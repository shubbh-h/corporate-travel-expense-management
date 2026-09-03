const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
    },
    // Null sender = system-generated notification (e.g. automated reminders, fraud alerts)
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Coarse notification category, as requested by the notification module spec.
    // Specific event details (e.g. "trip approved" vs "trip rejected") live in
    // title/message and relatedEntity below, not in this enum.
    type: {
      type: String,
      enum: ['trip', 'expense', 'approval', 'finance', 'system', 'reminder', 'security'],
      required: [true, 'Notification type is required'],
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    readStatus: {
      isRead: { type: Boolean, default: false },
      readAt: { type: Date, default: null },
    },

    link: { type: String, trim: true }, // frontend deep-link, e.g. /trips/TRP-2026-00042

    // Generic polymorphic reference so a notification can point at any entity
    // (Trip, Expense, Reimbursement, etc.) without needing a field per type.
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Trip', 'Expense', 'Reimbursement', 'User', 'CompanyPolicy', null],
        default: null,
      },
      entityId: { type: Schema.Types.ObjectId, default: null },
    },

    // Optional TTL - e.g. reminder notifications can auto-expire from the inbox.
    expiresAt: { type: Date, default: null },

    // Soft delete: a user "deleting" a notification just hides it from their
    // inbox while preserving it for admin notification history/audit.
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ============================================================
// Indexes
// ============================================================
notificationSchema.index({ receiver: 1, 'readStatus.isRead': 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });
notificationSchema.index({ isDeleted: 1 });
// TTL index: MongoDB automatically deletes the document once expiresAt passes.
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
