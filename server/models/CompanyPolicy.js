const mongoose = require('mongoose');
const { Schema } = mongoose;

const companyPolicySchema = new Schema(
  {
    policyName: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true,
      maxlength: [150, 'Policy name cannot exceed 150 characters'],
    },

    policyCode: {
      // Stable identifier used in references/audit logs even if the name is edited later
      type: String,
      required: [true, 'Policy code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },

    policyType: {
      type: String,
      enum: ['travel', 'expense', 'reimbursement', 'leave', 'code_of_conduct', 'general'],
      required: [true, 'Policy type is required'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    document: {
      // The uploaded PDF/DOCX of the full policy text
      url: { type: String },
      publicId: { type: String },
      fileType: { type: String },
    },

    version: {
      type: String,
      default: '1.0',
      trim: true,
    },

    // Departments this policy applies to. Empty array = applies company-wide.
    applicableDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],

    // Roles this policy applies to. Empty array = applies to all roles.
    applicableRoles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],

    effectiveDate: {
      type: Date,
      required: [true, 'Effective date is required'],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || !this.effectiveDate || value > this.effectiveDate;
        },
        message: 'Expiry date must be after the effective date',
      },
    },

    isMandatory: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    // Compliance trail: which employees have read/accepted this policy version.
    acknowledgedBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        acknowledgedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// Note: `unique: true` on policyCode above already creates its index.
companyPolicySchema.index({ policyType: 1, isActive: 1 });
companyPolicySchema.index({ effectiveDate: 1, expiryDate: 1 });

// ---------- Virtuals ----------
// Whether the policy is currently within its effective window - purely derived.
companyPolicySchema.virtual('isCurrentlyEffective').get(function () {
  const now = Date.now();
  const afterStart = !this.effectiveDate || this.effectiveDate.getTime() <= now;
  const beforeExpiry = !this.expiryDate || this.expiryDate.getTime() >= now;
  return this.isActive && afterStart && beforeExpiry;
});

companyPolicySchema.set('toJSON', { virtuals: true });
companyPolicySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CompanyPolicy', companyPolicySchema);
