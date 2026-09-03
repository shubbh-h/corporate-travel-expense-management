const mongoose = require('mongoose');
const { Schema } = mongoose;

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },

    code: {
      // Short code used in trip/expense IDs and financial exports, e.g. "ENG", "SALES"
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    head: {
      // The manager/employee who heads this department
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Self-reference to support a hierarchical department tree (e.g. Sub-department of Engineering)
    parentDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },

    costCenter: {
      // Finance-facing accounting code, distinct from the "code" used in UI
      type: String,
      required: [true, 'Cost center is required'],
      unique: true,
      trim: true,
    },

    budget: {
      annual: { type: Number, default: 0, min: 0 },
      monthly: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'INR' },
      fiscalYearStart: { type: Date },
    },

    // Running total of approved spend for the current fiscal year, updated by the
    // finance service layer whenever a reimbursement is marked "paid".
    budgetUtilized: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// Note: `unique: true` on name/code/costCenter above already creates their indexes.
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ parentDepartment: 1 });

// ---------- Virtuals ----------
// Percentage of annual budget consumed so far - purely derived, never persisted.
departmentSchema.virtual('budgetUtilizationPercent').get(function () {
  if (!this.budget?.annual) return 0;
  return Math.round((this.budgetUtilized / this.budget.annual) * 100);
});

// Reverse-populate all employees belonging to this department.
departmentSchema.virtual('employees', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
});

departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Department', departmentSchema);
