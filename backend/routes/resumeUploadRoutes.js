const { parseResumeText } = require("../services/resumeParser");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const Resume = require("../models/Resume");
const User = require("../models/User");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDirectory = path.join(
  __dirname,
  "../uploads/resumes"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/*
  POST /api/resume/upload

  Upload a PDF resume and extract its text.
*/
router.post(
  "/upload",
  authenticateUser,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a PDF resume.",
        });
      }

      const user = await User.findOne({
        firebaseUid: req.firebaseUser.uid,
      });

      if (!user) {
        fs.unlinkSync(req.file.path);

        return res.status(404).json({
          success: false,
          message: "Careerly user profile not found",
        });
      }

      const pdfBuffer = fs.readFileSync(
        req.file.path
      );

      const pdfData = await pdfParse(pdfBuffer);

      const extractedText =
        pdfData.text?.trim() || "";

        console.log("EXTRACTED RESUME TEXT:");
console.log(extractedText);

        const parsedData = await parseResumeText(extractedText);

        console.log(
  "PARSED RESUME DATA:",
  JSON.stringify(parsedData, null, 2)
);

      const resume = await Resume.create({
        userId: user._id,

        name:
          req.body.name ||
          path.parse(req.file.originalname).name,

        fileUrl: `/uploads/resumes/${req.file.filename}`,

        extractedText,

        parsedData,

        isDefault: false,
      });

      res.status(201).json({
        success: true,
        message: "Resume uploaded and text extracted successfully",
        resume,
      });
    } catch (error) {
      console.error(
        "Resume upload/extraction error:",
        error.message
      );

      if (
        req.file?.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: "Failed to upload and process resume",
      });
    }
  }
);

module.exports = router;