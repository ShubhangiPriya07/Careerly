const express = require("express");

const RecommendationFeedback = require(
  "../models/RecommendationFeedback"
);

const User = require("../models/User");

const authenticateUser = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

/*
  POST /api/recommendation-feedback

  Saves "Not Interested" feedback for a recommended job.
*/
router.post(
  "/",
  authenticateUser,
  async (req, res) => {
    try {
      const {
        source,
        externalId,
        jobTitle,
        company,
      } = req.body;

      if (!source || !externalId) {
        return res.status(400).json({
          success: false,
          message:
            "Job source and external ID are required.",
        });
      }

      const user =
        await User.findOne({
          firebaseUid:
            req.firebaseUser.uid,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Careerly user profile not found.",
        });
      }

      const feedback =
        await RecommendationFeedback.findOneAndUpdate(
          {
            userId: user._id,
            source,
            externalId: String(
              externalId
            ),
          },
          {
            userId: user._id,
            source,
            externalId: String(
              externalId
            ),
            jobTitle:
              typeof jobTitle ===
              "string"
                ? jobTitle
                : "",
            company:
              typeof company ===
              "string"
                ? company
                : "",
            feedback:
              "not_interested",
          },
          {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
          }
        );

      res.status(200).json({
        success: true,
        message:
          "Recommendation feedback saved.",
        feedback,
      });
    } catch (error) {
      console.error(
        "Recommendation feedback error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save recommendation feedback.",
      });
    }
  }
);

module.exports = router;