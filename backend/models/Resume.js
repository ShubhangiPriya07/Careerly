const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      default: "",
    },

    extractedText: {
      type: String,
      default: "",
    },

    parsedData: {
      skills: [
        {
          type: String,
          trim: true,
        },
      ],

      education: [
        {
          institution: String,
          degree: String,
          field: String,
          startDate: Date,
          endDate: Date,
        },
      ],

      experience: [
        {
          company: String,
          role: String,
          description: String,
          startDate: Date,
          endDate: Date,
        },
      ],

      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
        },
      ],
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", resumeSchema);