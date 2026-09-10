const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
      index: true,
    },

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "job-match",
        "resume-comparison",
        "resume-tailoring",
        "job-summary",
        "interview-prep",
        "skill-gap",
      ],
      required: true,
    },

    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    strengths: [
      {
        type: String,
        trim: true,
      },
    ],

    missingSkills: [
      {
        type: String,
        trim: true,
      },
    ],

    summary: {
      type: String,
      default: "",
    },

    recommendations: [
      {
        type: String,
        trim: true,
      },
    ],

    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);