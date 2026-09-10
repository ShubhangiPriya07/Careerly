const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    externalId: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      required: true,
    },

    title: {
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

    description: {
      type: String,
      default: "",
    },

    jobType: {
      type: String,
      default: "",
    },

    workMode: {
      type: String,
      default: "",
    },

    salary: {
      type: String,
      default: "",
    },

    applicationUrl: {
      type: String,
      default: "",
    },

    postedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

savedJobSchema.index(
  {
    user: 1,
    externalId: 1,
    source: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("SavedJob", savedJobSchema);