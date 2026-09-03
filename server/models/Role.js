const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Canonical permission catalogue for the platform.
 * Kept as an enum (rather than free-text) so that permission checks
 * throughout the app are typo-proof and centrally auditable.
 */
const PERMISSIONS = [
  'trip_approval',
  'expense_approval',
  'user_management',
  'department_management',
  'role_management',
  'analytics',
  'settings',
  'finance',
  'reimbursement_processing',
  'policy_management',
  'audit_log_view',
  'reports_export',
  'notification_management',
];

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      // e.g. "Employee", "Manager", "Finance Team", "Admin", or a custom role
      maxlength: [50, 'Role name cannot exceed 50 characters'],
    },

    slug: {
      // URL / code-friendly identifier derived from name, e.g. "finance-team"
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    permissions: {
      type: [{ type: String, enum: PERMISSIONS }],
      default: [],
      validate: {
        validator: (arr) => new Set(arr).size === arr.length,
        message: 'Permissions array cannot contain duplicates',
      },
    },

    /**
     * Numeric hierarchy level used for approval-chain and escalation logic
     * (e.g. an approver must have a strictly higher level than the requester).
     * Lower number = lower authority. Not unique - multiple roles can share a level.
     */
    level: {
      type: Number,
      required: true,
      min: [1, 'Level must be at least 1'],
      default: 1,
    },

    // System roles (Employee/Manager/Finance/Admin) are seeded at install time
    // and cannot be deleted or renamed from the UI, only custom roles can.
    isSystemRole: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// Note: `unique: true` on the `name` and `slug` fields above already creates
// their indexes, so no explicit schema.index() calls are needed for them.
roleSchema.index({ isActive: 1 });

// ---------- Virtuals ----------
// Reverse-populate every user assigned to this role without storing a redundant array on Role.
roleSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role',
});

// ---------- Instance methods ----------
roleSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

roleSchema.set('toJSON', { virtuals: true });
roleSchema.set('toObject', { virtuals: true });

roleSchema.statics.PERMISSIONS = PERMISSIONS;

module.exports = mongoose.model('Role', roleSchema);
