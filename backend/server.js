const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
require("./config/firebaseAdmin");

const authenticateUser = require("./middleware/authMiddleware");

const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const savedJobRoutes = require("./routes/savedJobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const resumeUploadRoutes = require("./routes/resumeUploadRoutes");
const aiRoutes = require("./routes/aiRoutes");
const recommendationFeedbackRoutes = require("./routes/recommendationFeedbackRoutes");

const path = require("path");

const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/resume", resumeUploadRoutes);
app.use("/api/ai", aiRoutes);
app.use(
  "/api/recommendation-feedback",
  recommendationFeedbackRoutes
);

app.get("/", (req, res) => {
  res.json({
    message: "Careerly backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Careerly API is healthy",
  });
});

app.get(
  "/api/protected-test",
  authenticateUser,
  (req, res) => {
    res.json({
      success: true,
      message: "Authentication successful",
      user: {
        uid: req.firebaseUser.uid,
        email: req.firebaseUser.email || null,
      },
    });
  }
);

app.listen(PORT, () => {
  console.log(
    `Careerly backend running on http://localhost:${PORT}`
  );
});