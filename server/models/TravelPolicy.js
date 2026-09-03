const mongoose = require('mongoose');
const { Schema } = mongoose;

const blackoutDateSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true },
  },
  { _id: false }
);

const travelPolicySchema = new Schema(
  {
    policyName: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true,
      maxlength: [150, 'Policy name cannot exceed 150 characters'],
    },

    // Optional link back to the umbrella CompanyPolicy document this rule set implements.
    companyPolicy: { type: Schema.Types.ObjectId, ref: 'CompanyPolicy', default: null },

    travelType: {
      type: String,
      enum: ['domestic', 'international', 'both'],
      default: 'both',
    },

    // Scope: which roles / departments this rule set applies to.
    // Empty arrays mean "applies to everyone" (the default company-wide policy).
    applicableRoles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    applicableDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],

    maxTripBudget: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    perDiem: {
      amount: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    maxHotelBudgetPerNight: {
      amount: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    allowedBookingClass: {
      flight: {
        type: String,
        enum: ['economy', 'premium_economy', 'business', 'first'],
        default: 'economy',
      },
      train: {
        type: String,
        enum: ['sleeper', 'ac_3_tier', 'ac_2_tier', 'ac_first_class'],
        default: 'ac_3_tier',
      },
      hotelMaxStarRating: {
        type: Number,
        min: 1,
        max: 7,
        default: 4,
      },
    },

    advanceBookingDaysRequired: {
      // Minimum number of days before travel that a booking/request must be raised
      type: Number,
      default: 3,
      min: 0,
    },

    maxTripDurationDays: {
      type: Number,
      default: 30,
      min: 1,
    },

    blackoutDates: [blackoutDateSchema],

    requiresVisaAssistance: { type: Boolean, default: false },
    requiresTravelInsurance: { type: Boolean, default: true },

    // Whether trips that breach these limits can still be submitted for a manual
    // exception approval, or are hard-blocked at submission time.
    allowExceptionApproval: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },
    effectiveDate: { type: Date, default: Date.now },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
travelPolicySchema.index({ travelType: 1, isActive: 1 });
travelPolicySchema.index({ applicableDepartments: 1 });
travelPolicySchema.index({ applicableRoles: 1 });

module.exports = mongoose.model('TravelPolicy', travelPolicySchema);
