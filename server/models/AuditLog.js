const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    user: {
      // The actor who performed the action. Required - audit logs must always be attributable.
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },

    action: {
      // Coarse, machine-readable action code, e.g. "TRIP_APPROVED", "USER_SUSPENDED",
      // "EXPENSE_REJECTED", "POLICY_UPDATED", "ROLE_PERMISSIONS_CHANGED".
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      uppercase: true,
    },

    entity: {
      // The model/collection name the action was performed against.
      type: String,
      enum: ['User', 'Department', 'Role', 'Trip', 'Expense', 'Reimbursement', 'CompanyPolicy', 'TravelPolicy'],
      required: [true, 'Entity is required'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },

    description: { type: String, trim: true },

    ipAddress: { type: String, trim: true },
    browser: { type: String, trim: true }, // parsed user-agent, e.g. "Chrome 126 on macOS"
    userAgent: { type: String, trim: true }, // raw user-agent string, kept for forensic detail

    // Field-level before/after snapshot for change tracking. Stored as Mixed since the
    // shape varies per entity type; kept intentionally schemaless for flexibility.
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // audit logs are append-only, never updated
  }
);

// ============================================================
// Indexes
// ============================================================
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
