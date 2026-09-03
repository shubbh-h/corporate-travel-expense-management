const mongoose = require('mongoose');
const { Schema } = mongoose;

const reimbursementSchema = new Schema(
  {
    reimbursementNumber: {
      type: String,
      unique: true,
      // Auto-generated in pre-save hook
    },

    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },

    // A reimbursement batches one or more already-verified expenses into a single payout.
    expenses: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Expense' }],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'A reimbursement must include at least one expense',
      },
    },

    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    currency: { type: String, default: 'INR' },

    financeApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      rejectionReason: String,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'on_hold'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cheque', 'cash', 'payroll'],
      default: 'bank_transfer',
    },
    transactionId: { type: String, trim: true },
    paymentDate: Date,
    failureReason: String,

    // Non-sensitive snapshot of the payout destination at time of payment (never store full account numbers).
    bankDetailsSnapshot: {
      accountNumberMasked: String, // e.g. "XXXX-XXXX-4821"
      ifscCode: String,
      bankName: String,
    },

    comments: [
      {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ============================================================
// Indexes
// ============================================================
// Note: `unique: true` on reimbursementNumber above already creates its index.
reimbursementSchema.index({ employee: 1, paymentStatus: 1 });
reimbursementSchema.index({ paymentDate: 1 });
reimbursementSchema.index({ 'financeApproval.status': 1 });

// ============================================================
// Virtuals
// ============================================================
// Days elapsed between raising the reimbursement and actual payout - useful for the
// "Reimbursement Time" analytics metric.
reimbursementSchema.virtual('processingDays').get(function () {
  if (!this.paymentDate) return null;
  const diffMs = this.paymentDate - this.createdAt;
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
});

// ============================================================
// Hooks
// ============================================================
reimbursementSchema.pre('save', async function (next) {
  if (this.isNew && !this.reimbursementNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Reimbursement').countDocuments();
    this.reimbursementNumber = `RMB-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

reimbursementSchema.set('toJSON', { virtuals: true });
reimbursementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
