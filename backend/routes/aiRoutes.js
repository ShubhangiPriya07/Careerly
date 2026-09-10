const express = require("express");

const authenticateUser = require("../middleware/authMiddleware");

const {
    testAI,
    matchJob,
    recommendJobs,
    tailorResume,
} = require("../controllers/aiController");

const router = express.Router();

router.get(
    "/test",
    authenticateUser,
    testAI
);

router.post(
    "/match-job",
    authenticateUser,
    matchJob
);

router.get(
    "/recommendations",
    authenticateUser,
    recommendJobs
);

router.post(
    "/tailor-resume",
    authenticateUser,
    tailorResume
);

module.exports = router;