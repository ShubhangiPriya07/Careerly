const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },

    externalId: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      required: true,
    },

    jobTitle: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      default: "",
    },

    applicationUrl: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "Interview",
        "Offer",
        "Rejected",
        "Withdrawn",
      ],
      default: "Applied",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      default: "",
    },

    nextStep: {
      type: String,
      default: "",
    },

    nextStepDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index(
  {
    user: 1,
    externalId: 1,
    source: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Application", applicationSchema);