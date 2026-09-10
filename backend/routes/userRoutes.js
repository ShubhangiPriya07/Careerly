const express = require("express");
const User = require("../models/User");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

/*
  POST /api/users/sync
  Creates or updates the Careerly user after Firebase authentication.
*/
router.post("/sync", authenticateUser, async (req, res) => {
  try {
    const { uid, email, name } = req.firebaseUser;

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        firebaseUid: uid,
        email: email || "",
        name: name || "",
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "User synced successfully",
      user,
    });
  } catch (error) {
    console.error("User sync error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to sync user",
    });
  }
});

/*
  GET /api/users/me
  Returns the currently authenticated user's Careerly profile.
*/
router.get("/me", authenticateUser, async (req, res) => {
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

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
});

/*
  PUT /api/users/me
  Updates the currently authenticated user's Careerly profile.
*/
router.put("/me", authenticateUser, async (req, res) => {
  try {
    const {
      name,
      profile,
      preferences,
    } = req.body;

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (profile !== undefined) {
      updateData.profile = profile;
    }

    if (preferences !== undefined) {
      if (preferences.theme !== undefined) {
        updateData["preferences.theme"] =
          preferences.theme;
      }

      if (preferences.roles !== undefined) {
        updateData["preferences.roles"] =
          preferences.roles;
      }

      if (preferences.locations !== undefined) {
        updateData["preferences.locations"] =
          preferences.locations;
      }

      if (preferences.workModes !== undefined) {
        updateData["preferences.workModes"] =
          preferences.workModes;
      }

      if (
        preferences.employmentTypes !== undefined
      ) {
        updateData["preferences.employmentTypes"] =
          preferences.employmentTypes;
      }

      if (
        preferences.experienceLevel !== undefined
      ) {
        updateData["preferences.experienceLevel"] =
          preferences.experienceLevel;
      }
    }

    const user = await User.findOneAndUpdate(
      {
        firebaseUid: req.firebaseUser.uid,
      },
      {
        $set: updateData,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Careerly user profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error(
      "Update user error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to update user profile",
    });
  }
});

module.exports = router;