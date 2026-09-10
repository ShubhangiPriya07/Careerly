const mongoose = require("mongoose");

const recommendationFeedbackSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      source: {
        type: String,
        required: true,
        trim: true,
      },

      externalId: {
        type: String,
        required: true,
        trim: true,
      },

      jobTitle: {
        type: String,
        default: "",
        trim: true,
      },

      company: {
        type: String,
        default: "",
        trim: true,
      },

      feedback: {
        type: String,
        enum: ["not_interested"],
        required: true,
        default: "not_interested",
      },
    },
    {
      timestamps: true,
    }
  );

recommendationFeedbackSchema.index(
  {
    userId: 1,
    source: 1,
    externalId: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.model(
    "RecommendationFeedback",
    recommendationFeedbackSchema
  );