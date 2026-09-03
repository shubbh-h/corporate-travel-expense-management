const mongoose = require('mongoose');
const { Schema } = mongoose;

const receiptSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'jpg', 'jpeg', 'png', 'docx'] },
    originalName: String,
    // SHA-256 hash of the file content - the primary signal for exact-duplicate detection.
    fileHash: { type: String, index: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Structured data extracted by the OCR receipt scanner (see BONUS "AI Receipt OCR").
const ocrDataSchema = new Schema(
  {
    isProcessed: { type: Boolean, default: false },
    extractedMerchantName: String,
    extractedAmount: Number,
    extractedDate: Date,
    extractedGstNumber: String,
    rawText: String,
    confidenceScore: { type: Number, min: 0, max: 1 }, // 0-1 OCR confidence
    processedAt: Date,
    processingError: String,
  },
  { _id: false }
);

const duplicateDetectionSchema = new Schema(
  {
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'Expense', default: null },
    matchType: {
      type: String,
      enum: ['exact_file_hash', 'same_amount_date_merchant', 'invoice_number', 'none'],
      default: 'none',
    },
    similarityScore: { type: Number, min: 0, max: 1, default: 0 },
    checkedAt: Date,
  },
  { _id: false }
);

const fraudFlagSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'duplicate_bill',
        'duplicate_invoice',
        'budget_violation',
        'suspicious_amount',
        'overlapping_trip',
        'duplicate_hotel',
        'duplicate_flight',
        'receipt_manipulation',
        'multiple_claims',
      ],
      required: true,
    },
    description: { type: String, trim: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    flaggedAt: { type: Date, default: Date.now },
    flaggedBy: {
      // "system" for automated detection, or a user ObjectId if flagged manually by Finance/Admin
      type: Schema.Types.Mixed,
      default: 'system',
    },
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: String,
  },
  { _id: true }
);

const commentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const expenseSchema = new Schema(
  {
    expenseNumber: {
      type: String,
      unique: true,
      // Auto-generated in pre-save hook
    },

    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      default: null, // expenses may optionally be filed independent of a trip
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },

    category: {
      type: String,
      enum: ['hotel', 'flight', 'train', 'cab', 'food', 'miscellaneous'],
      required: [true, 'Expense category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: { type: String, required: true, default: 'INR' },
    exchangeRateToBase: { type: Number, default: 1, min: 0 },
    amountInBaseCurrency: { type: Number }, // derived in pre-save hook

    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      validate: {
        validator: (value) => value <= new Date(),
        message: 'Expense date cannot be in the future',
      },
    },

    merchantName: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    receiptNumber: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },

    mileage: {
      distanceKm: { type: Number, min: 0 },
      ratePerKm: { type: Number, min: 0 },
    },

    // File upload is handled by a separate module (out of scope here), so receipts
    // start empty and are attached later - not required at creation time.
    receipts: { type: [receiptSchema], default: [] },
    ocrData: { type: ocrDataSchema, default: () => ({}) },
    duplicateDetection: { type: duplicateDetectionSchema, default: () => ({}) },
    fraudFlags: [fraudFlagSchema],

    // Manager/peer verification of the claim's legitimacy (separate from Finance's payment sign-off).
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,

    // Finance team's independent sign-off, required before a Reimbursement can be created.
    financeStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'on_hold', 'reimbursed'],
      default: 'pending',
    },
    financeReviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    financeReviewedAt: Date,
    reimbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reimbursedAt: Date,

    comments: [commentSchema],

    // Soft delete: employees can only delete pending expenses, and the record
    // is preserved (not removed) for the "Expense History" audit trail.
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ============================================================
// Indexes
// ============================================================
// Note: `unique: true` on expenseNumber above already creates its index.
expenseSchema.index({ employee: 1, financeStatus: 1 });
expenseSchema.index({ department: 1, category: 1 });
expenseSchema.index({ expenseDate: 1 });
expenseSchema.index({ trip: 1 });
expenseSchema.index({ 'duplicateDetection.isDuplicate': 1 });
expenseSchema.index({ financeStatus: 1, verificationStatus: 1 });
expenseSchema.index({ isDeleted: 1 });

// ============================================================
// Virtuals
// ============================================================
expenseSchema.virtual('isFlagged').get(function () {
  return this.fraudFlags?.some((f) => !f.isResolved) || false;
});

// ============================================================
// Hooks
// ============================================================
expenseSchema.pre('save', async function (next) {
  if (this.isNew && !this.expenseNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Expense').countDocuments();
    this.expenseNumber = `EXP-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  // Keep the base-currency amount in sync whenever amount or exchange rate changes.
  if (this.isModified('amount') || this.isModified('exchangeRateToBase')) {
    this.amountInBaseCurrency = Math.round(this.amount * (this.exchangeRateToBase || 1) * 100) / 100;
  }
  next();
});

expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);
