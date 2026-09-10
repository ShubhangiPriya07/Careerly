const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    profile: {
      headline: {
        type: String,
        default: "",
        trim: true,
      },

      location: {
        type: String,
        default: "",
        trim: true,
      },

      education: [
        {
          institution: {
            type: String,
            trim: true,
          },
          degree: {
            type: String,
            trim: true,
          },
          field: {
            type: String,
            trim: true,
          },
          startDate: Date,
          endDate: Date,
        },
      ],

      experience: [
        {
          company: {
            type: String,
            trim: true,
          },
          role: {
            type: String,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
          startDate: Date,
          endDate: Date,
          current: {
            type: Boolean,
            default: false,
          },
        },
      ],

      skills: [
        {
          type: String,
          trim: true,
        },
      ],

      projects: [
        {
          name: {
            type: String,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
          technologies: [
            {
              type: String,
              trim: true,
            },
          ],
          link: {
            type: String,
            trim: true,
          },
        },
      ],
    },

    preferences: {
      roles: [
        {
          type: String,
          trim: true,
        },
      ],

      locations: [
        {
          type: String,
          trim: true,
        },
      ],

      workModes: [
        {
          type: String,
          enum: ["Remote", "Hybrid", "On-site"],
        },
      ],

      employmentTypes: [
        {
          type: String,
          enum: [
            "Internship",
            "Full-time",
            "Part-time",
            "Contract",
          ],
        },
      ],

      experienceLevel: {
        type: String,
        enum: [
          "Internship",
          "Entry Level",
          "Mid Level",
          "Senior Level",
          "Any",
        ],
        default: "Any",
      },

      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);