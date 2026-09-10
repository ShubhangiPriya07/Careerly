const express = require("express");

const Application = require("../models/Application");
const User = require("../models/User");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

/*
  POST /api/applications

  Create a new application.
*/
router.post("/", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.firebaseUser.uid,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Careerly user profile not found",
      });
    }

    const {
      externalId,
      source,
      jobTitle,
      company,
      location,
      applicationUrl,
      appliedAt,
      notes,
      nextStep,
      nextStepDate,
      resumeId,
    } = req.body;

    if (!externalId || !source || !jobTitle || !company) {
      return res.status(400).json({
        success: false,
        message: "Missing required application information",
      });
    }

    const existingApplication = await Application.findOne({
      user: user._id,
      externalId,
      source,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "Application already exists",
        application: existingApplication,
      });
    }

    const application = await Application.create({
      user: user._id,
      resumeId: resumeId || null,
      externalId,
      source,
      jobTitle,
      company,
      location: location || "",
      applicationUrl: applicationUrl || "",
      appliedAt: appliedAt || Date.now(),
      notes: notes || "",
      nextStep: nextStep || "",
      nextStepDate: nextStepDate || null,
    });

    res.status(201).json({
      success: true,
      message: "Application created successfully",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create application",
    });
  }
});

/*
  GET /api/applications/check/:source/:externalId

  Check whether the authenticated user is already
  tracking a particular job application.
*/
router.get(
  "/check/:source/:externalId",
  authenticateUser,
  async (req, res) => {
    try {
      const user = await User.findOne({
        firebaseUid: req.firebaseUser.uid,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Careerly user profile not found",
        });
      }

      const application = await Application.findOne({
        user: user._id,
        source: req.params.source,
        externalId: req.params.externalId,
      });

      res.status(200).json({
        success: true,
        tracked: Boolean(application),
        application: application || null,
      });
    } catch (error) {
      console.error(
        "Check application error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Failed to check application",
      });
    }
  }
);

/*
  GET /api/applications

  Get all applications belonging to the authenticated user.
*/
router.get("/", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.firebaseUser.uid,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Careerly user profile not found",
      });
    }

    const applications = await Application.find({
      user: user._id,
    }).sort({
      appliedAt: -1,
    });

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
});

/*
  PUT /api/applications/:id

  Update application status/details.
*/
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.firebaseUser.uid,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Careerly user profile not found",
      });
    }

    const {
      status,
      notes,
      nextStep,
      nextStepDate,
    } = req.body;

    const updateData = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (nextStep !== undefined) {
      updateData.nextStep = nextStep;
    }

    if (nextStepDate !== undefined) {
      updateData.nextStepDate = nextStepDate;
    }

    const application = await Application.findOneAndUpdate(
      {
        _id: req.params.id,
        user: user._id,
      },
      {
        $set: updateData,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update application",
    });
  }
});

/*
  DELETE /api/applications/:id

  Delete an application.
*/
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.firebaseUser.uid,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Careerly user profile not found",
      });
    }

    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete application error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete application",
    });
  }
});

module.exports = router;