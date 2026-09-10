const express = require("express");

const SavedJob = require("../models/SavedJob");
const User = require("../models/User");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

/*
  POST /api/saved-jobs

  Save a job for the authenticated user.
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
      title,
      company,
      location,
      description,
      jobType,
      workMode,
      salary,
      applicationUrl,
      postedAt,
    } = req.body;

    if (!externalId || !source || !title || !company) {
      return res.status(400).json({
        success: false,
        message: "Missing required job information",
      });
    }

    const existingJob = await SavedJob.findOne({
      user: user._id,
      externalId,
      source,
    });

    if (existingJob) {
      return res.status(409).json({
        success: false,
        message: "Job already saved",
        savedJob: existingJob,
      });
    }

    const savedJob = await SavedJob.create({
      user: user._id,
      externalId,
      source,
      title,
      company,
      location: location || "",
      description: description || "",
      jobType: jobType || "",
      workMode: workMode || "",
      salary: salary || "",
      applicationUrl: applicationUrl || "",
      postedAt: postedAt || null,
    });

    res.status(201).json({
      success: true,
      message: "Job saved successfully",
      savedJob,
    });
  } catch (error) {
    console.error("Save job error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save job",
    });
  }
});

/*
  GET /api/saved-jobs

  Get all saved jobs belonging to the authenticated user.
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

    const savedJobs = await SavedJob.find({
      user: user._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      savedJobs,
    });
  } catch (error) {
    console.error("Get saved jobs error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
    });
  }
});

/*
  GET /api/saved-jobs/check/:source/:externalId

  Check whether a job is already saved.
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

      const savedJob = await SavedJob.findOne({
        user: user._id,
        source: req.params.source,
        externalId: req.params.externalId,
      });

      res.status(200).json({
        success: true,
        saved: Boolean(savedJob),
        savedJob: savedJob || null,
      });
    } catch (error) {
      console.error("Check saved job error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to check saved job",
      });
    }
  }
);

/*
  GET /api/saved-jobs/external/:source/:externalId

  Get a saved job using its external ID.

  This is used when opening a saved job from
  the Saved Jobs page.
*/
router.get(
  "/external/:source/:externalId",
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

      const { source, externalId } = req.params;

      const job = await SavedJob.findOne({
        user: user._id,
        source,
        externalId,
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Saved job not found",
        });
      }

      res.status(200).json({
        success: true,
        job,
      });
    } catch (error) {
      console.error("Get saved job error:", error.message);

      res.status(500).json({
        success: false,
        message: "Failed to fetch saved job",
      });
    }
  }
);

/*
  DELETE /api/saved-jobs/:id

  Remove a saved job.
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

    const savedJob = await SavedJob.findOneAndDelete({
      _id: req.params.id,
      user: user._id,
    });

    if (!savedJob) {
      return res.status(404).json({
        success: false,
        message: "Saved job not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
    });
  } catch (error) {
    console.error("Delete saved job error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to remove saved job",
    });
  }
});

module.exports = router;