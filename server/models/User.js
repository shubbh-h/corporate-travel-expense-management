const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Schema } = mongoose;

const emergencyContactSchema = new Schema(
  {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true },
  },
  { _id: false }
);

const travelPreferencesSchema = new Schema(
  {
    preferredAirline: { type: String, trim: true },
    seatPreference: {
      type: String,
      enum: ['window', 'aisle', 'middle', 'no_preference'],
      default: 'no_preference',
    },
    mealPreference: {
      type: String,
      enum: ['vegetarian', 'non_vegetarian', 'vegan', 'jain', 'no_preference'],
      default: 'no_preference',
    },
    preferredHotelChain: { type: String, trim: true },
    frequentFlyerNumbers: [
      {
        airline: String,
        number: String,
      },
    ],
  },
  { _id: false }
);

const notificationPreferencesSchema = new Schema(
  {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    tripUpdates: { type: Boolean, default: true },
    expenseUpdates: { type: Boolean, default: true },
    approvalAlerts: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    // ---------- Personal information ----------
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s-()]{7,20}$/, 'Please provide a valid phone number'],
    },
    alternatePhone: { type: String, trim: true },
    address: { type: addressSchema, default: () => ({}) },
    profilePicture: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    emergencyContact: { type: emergencyContactSchema, default: () => ({}) },

    // ---------- Company information ----------
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    designation: {
      // Job title, e.g. "Senior Software Engineer"
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role is required'],
    },
    manager: {
      // Self-reference: the user this employee reports to (used for approval routing)
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dateOfJoining: { type: Date, default: Date.now },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern'],
      default: 'full_time',
    },
    workLocation: { type: String, trim: true },
    travelPreferences: { type: travelPreferencesSchema, default: () => ({}) },

    // ---------- Authentication fields ----------
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by default in queries
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },

    refreshTokens: {
      // Multiple concurrent sessions (web + mobile) each hold their own refresh token,
      // enabling per-device logout without invalidating other sessions.
      type: [
        {
          token: { type: String, required: true },
          userAgent: String,
          ipAddress: String,
          createdAt: { type: Date, default: Date.now },
          expiresAt: Date,
        },
      ],
      default: [],
      select: false,
    },

    // ---------- Account status ----------
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending_verification'],
      default: 'pending_verification',
    },
    suspendedReason: { type: String, trim: true },
    suspendedAt: { type: Date },
    suspendedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLogin: { type: Date },
    lastLoginIP: { type: String },

    // ---------- Preferences ----------
    notificationPreferences: { type: notificationPreferencesSchema, default: () => ({}) },
    monthlyBudget: { type: Number, default: 0, min: 0 },

    // Soft delete: an admin "deleting" an employee preserves the record (referenced
    // by past trips/expenses/audit logs) while removing them from active listings.
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// ============================================================
// Indexes
// ============================================================
// Note: `unique: true` on email/employeeId above already creates their indexes.
userSchema.index({ department: 1, role: 1 });
userSchema.index({ manager: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ firstName: 'text', lastName: 'text', employeeId: 'text' });

// ============================================================
// Virtuals
// ============================================================
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Account lockout state, derived from lockUntil rather than stored redundantly.
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ============================================================
// Hooks
// ============================================================

// Hash password whenever it is set/changed. bcrypt cost factor 12 balances
// security and login latency for an enterprise-scale user base.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // Skip on document creation so a freshly-registered user's token isn't
  // immediately invalidated by the "issued before password change" check.
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ============================================================
// Instance methods
// ============================================================
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Used by the auth middleware to reject tokens issued before a password change.
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
  return jwtTimestamp < changedTimestamp;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token; // raw token is emailed to the user; only the hash is persisted
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return token;
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  },
});
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
