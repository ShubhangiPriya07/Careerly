const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["Technical", "HR", "Behavioral", "Managerial", "Other"],
      default: "Other",
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },

    questions: [
      {
        type: String,
        trim: true,
      },
    ],

    preparation: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interview", interviewSchema);