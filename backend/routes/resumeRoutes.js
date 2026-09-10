const express = require("express");

const Resume = require("../models/Resume");
const User = require("../models/User");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

/*
  GET /api/resume

  Get the logged-in user's resumes.
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

    const resumes = await Resume.find({
      userId: user._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    console.error("Get resumes error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch resumes",
    });
  }
});

/*
  POST /api/resume

  Create a resume for the logged-in user.
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
      name,
      fileUrl,
      extractedText,
      parsedData,
      isDefault,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Resume name is required",
      });
    }

    if (isDefault) {
      await Resume.updateMany(
        {
          userId: user._id,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    const resume = await Resume.create({
      userId: user._id,
      name,
      fileUrl: fileUrl || "",
      extractedText: extractedText || "",
      parsedData: parsedData || {},
      isDefault: Boolean(isDefault),
    });

    res.status(201).json({
      success: true,
      message: "Resume created successfully",
      resume,
    });
  } catch (error) {
    console.error("Create resume error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create resume",
    });
  }
});

/*
  POST /api/resume/save-tailored

  Save an AI-tailored resume as a separate resume version.
*/
router.post(
  "/save-tailored",
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

      const {
        jobTitle,
        company,
        tailoredResume,
      } = req.body;

      if (!tailoredResume) {
        return res.status(400).json({
          success: false,
          message: "Tailored resume data is required",
        });
      }

      const safeTailoredResume = {
        skills: Array.isArray(tailoredResume.skills)
          ? tailoredResume.skills
          : [],

        experience: Array.isArray(
          tailoredResume.experience
        )
          ? tailoredResume.experience
          : [],

        projects: Array.isArray(
          tailoredResume.projects
        )
          ? tailoredResume.projects
          : [],

        education: Array.isArray(
          tailoredResume.education
        )
          ? tailoredResume.education
          : [],
      };

      const resumeName = company
        ? `Tailored Resume - ${company}`
        : jobTitle
        ? `Tailored Resume - ${jobTitle}`
        : "Tailored Resume";

      const resume = await Resume.create({
        userId: user._id,
        name: resumeName,
        fileUrl: "",
        extractedText: "",
        parsedData: safeTailoredResume,
        isDefault: false,
      });

      res.status(201).json({
        success: true,
        message: "Tailored resume saved successfully",
        resume,
      });
    } catch (error) {
      console.error(
        "Save tailored resume error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Failed to save tailored resume",
      });
    }
  }
);

/*
  PUT /api/resume/:id

  Update a resume.
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
      name,
      fileUrl,
      extractedText,
      parsedData,
      isDefault,
    } = req.body;

    if (isDefault === true) {
      await Resume.updateMany(
        {
          userId: user._id,
          _id: {
            $ne: req.params.id,
          },
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl;
    }

    if (extractedText !== undefined) {
      updateData.extractedText = extractedText;
    }

    if (parsedData !== undefined) {
      updateData.parsedData = parsedData;
    }

    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;
    }

    const resume = await Resume.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: user._id,
      },
      {
        $set: updateData,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Resume updated successfully",
      resume,
    });
  } catch (error) {
    console.error("Update resume error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update resume",
    });
  }
});

/*
  DELETE /api/resume/:id

  Delete a resume.
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

    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Delete resume error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete resume",
    });
  }
});

module.exports = router;