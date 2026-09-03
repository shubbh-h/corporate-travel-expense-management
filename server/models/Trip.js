const mongoose = require('mongoose');
const { Schema } = mongoose;

// ---------- Sub-schemas ----------

const approvalStepSchema = new Schema(
  {
    approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    level: { type: Number, required: true, min: 1 }, // order in the approval chain
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'skipped'],
      default: 'pending',
    },
    comments: { type: String, trim: true },
    actionedAt: { type: Date },
  },
  { _id: true, timestamps: true }
);

const flightDetailSchema = new Schema(
  {
    airline: String,
    flightNumber: String,
    from: String,
    to: String,
    departureDateTime: Date,
    arrivalDateTime: Date,
    bookingClass: {
      type: String,
      enum: ['economy', 'premium_economy', 'business', 'first'],
      default: 'economy',
    },
    pnr: String,
    cost: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' },
    ticketDocument: { url: String, publicId: String },
  },
  { _id: true }
);

const hotelDetailSchema = new Schema(
  {
    hotelName: String,
    address: String,
    checkIn: Date,
    checkOut: Date,
    roomType: String,
    starRating: { type: Number, min: 1, max: 7 },
    confirmationNumber: String,
    costPerNight: { type: Number, min: 0 },
    totalCost: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' },
    receiptDocument: { url: String, publicId: String },
  },
  { _id: true }
);

const cabDetailSchema = new Schema(
  {
    provider: String,
    from: String,
    to: String,
    pickupDateTime: Date,
    dropDateTime: Date,
    bookingReference: String,
    cost: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' },
    receiptDocument: { url: String, publicId: String },
  },
  { _id: true }
);

const timelineEventSchema = new Schema(
  {
    day: Number,
    date: Date,
    activity: { type: String, trim: true },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    name: String,
    url: String,
    publicId: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

// ---------- Main Trip schema ----------

const tripSchema = new Schema(
  {
    tripNumber: {
      type: String,
      unique: true,
      // Generated in the pre-save hook below; not required at input time.
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

    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    travelType: {
      type: String,
      enum: ['domestic', 'international'],
      required: [true, 'Travel type is required'],
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of travel is required'],
      trim: true,
      maxlength: [1000, 'Purpose cannot exceed 1000 characters'],
    },

    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'draft',
    },

    // Ordered multi-level approval chain (e.g. Manager -> Finance for high-value trips).
    approvalWorkflow: [approvalStepSchema],

    appliedTravelPolicy: { type: Schema.Types.ObjectId, ref: 'TravelPolicy' },
    isPolicyException: {
      // True if this trip breaches the applied travel policy and required manual override
      type: Boolean,
      default: false,
    },
    policyExceptionReason: { type: String, trim: true },

    budget: {
      estimated: { type: Number, required: [true, 'Estimated budget is required'], min: 0 },
      approved: { type: Number, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    flightDetails: [flightDetailSchema],
    hotelDetails: [hotelDetailSchema],
    cabDetails: [cabDetailSchema],

    visa: {
      required: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['not_applicable', 'pending', 'applied', 'approved', 'rejected'],
        default: 'not_applicable',
      },
      country: String,
      documentUrl: String,
      documentPublicId: String,
      expiryDate: Date,
    },

    insurance: {
      required: { type: Boolean, default: true },
      provider: String,
      policyNumber: String,
      coverageAmount: Number,
      documentUrl: String,
      documentPublicId: String,
      expiryDate: Date,
    },

    timeline: [timelineEventSchema],
    documents: [documentSchema],
    comments: [commentSchema],

    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },

    dates: {
      startDate: { type: Date, required: [true, 'Start date is required'] },
      endDate: { type: Date, required: [true, 'End date is required'] },
      actualStartDate: Date,
      actualEndDate: Date,
    },

    cancelledAt: Date,
    cancellationReason: { type: String, trim: true },
    completedAt: Date,

    isQrVerified: { type: Boolean, default: false },
    qrCode: String,

    // Soft delete: admin "deletes" trips without losing audit/history data.
    // All list/detail queries in tripService filter isDeleted: false by default.
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// ============================================================
// Validation
// ============================================================
// Cross-field validation on a nested plain object is done in pre-validate
// (schema.path() does not reliably resolve nested object sub-paths).
tripSchema.pre('validate', function (next) {
  if (this.dates?.startDate && this.dates?.endDate && this.dates.endDate < this.dates.startDate) {
    this.invalidate('dates.endDate', 'End date cannot be before start date');
  }
  next();
});

// ============================================================
// Indexes
// ============================================================
// Note: `unique: true` on tripNumber above already creates its index.
tripSchema.index({ employee: 1, status: 1 });
tripSchema.index({ department: 1, status: 1 });
tripSchema.index({ 'dates.startDate': 1, 'dates.endDate': 1 });
tripSchema.index({ destination: 'text', purpose: 'text', tripNumber: 'text' });
tripSchema.index({ isDeleted: 1 });

// ============================================================
// Virtuals
// ============================================================
// Trip duration in whole days - purely derived from the stored dates.
tripSchema.virtual('durationDays').get(function () {
  if (!this.dates?.startDate || !this.dates?.endDate) return 0;
  const diffMs = this.dates.endDate - this.dates.startDate;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
});

// Reverse-populate all expenses filed against this trip.
tripSchema.virtual('expenses', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'trip',
});

// ============================================================
// Hooks
// ============================================================
// Auto-generate a human-readable, sequential trip number on first save.
tripSchema.pre('save', async function (next) {
  if (!this.isNew || this.tripNumber) return next();
  const year = new Date().getFullYear();
  const count = await mongoose.model('Trip').countDocuments();
  this.tripNumber = `TRP-${year}-${String(count + 1).padStart(5, '0')}`;
  next();
});

tripSchema.set('toJSON', { virtuals: true });
tripSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);
