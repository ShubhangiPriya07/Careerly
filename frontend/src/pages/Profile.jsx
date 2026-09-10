import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";

import { auth } from "../config/firebase";

import {
  getCurrentUser,
  updateCurrentUser,
} from "../services/api";

import { useTheme } from "../context/ThemeContext";

import LoadingScreen from "../components/LoadingScreen";

import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] =
    useState(false);
  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);

  const [workType, setWorkType] = useState("Any");
  const [workMode, setWorkMode] = useState("Any");
  const [preferredLocation, setPreferredLocation] =
    useState("");
  const [experienceLevel, setExperienceLevel] =
    useState("Any");

  const {
    darkMode,
    toggleTheme,
  } = useTheme();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCurrentUser();
        const currentUser = data.user;

        setUser(currentUser);
        setName(currentUser?.name || "");

        const preferences =
          currentUser?.preferences || {};

        setWorkType(
          preferences.employmentTypes?.length
            ? preferences.employmentTypes[0]
            : "Any"
        );

        setWorkMode(
          preferences.workModes?.length
            ? preferences.workModes[0]
            : "Any"
        );

        setPreferredLocation(
          preferences.locations?.length
            ? preferences.locations[0]
            : ""
        );

        setExperienceLevel(
          preferences.experienceLevel || "Any"
        );
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error
        );

        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSaveName = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = await updateCurrentUser({
        name: trimmedName,
      });

      setUser(data.user);
      setName(data.user?.name || trimmedName);

      setEditing(false);

      setSuccess(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to update profile:",
        error
      );

      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user?.name || "");
    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleThemeToggle = async () => {
    try {
      setError("");
      setSuccess("");

      await toggleTheme();

      setSuccess(
        darkMode
          ? "Light mode enabled."
          : "Dark mode enabled."
      );
    } catch (error) {
      console.error(
        "Failed to change theme:",
        error
      );

      setError(
        "Failed to save theme preference."
      );
    }
  };

  const handleSaveJobPreferences = async () => {
    try {
      setSavingPreferences(true);
      setError("");
      setSuccess("");

      const preferences = {
        employmentTypes:
          workType === "Any"
            ? []
            : [workType],

        workModes:
          workMode === "Any"
            ? []
            : [workMode],

        locations:
          preferredLocation.trim()
            ? [preferredLocation.trim()]
            : [],

        experienceLevel,
      };

      const data = await updateCurrentUser({
        preferences,
      });

      setUser(data.user);

      setSuccess(
        "Job preferences saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save job preferences:",
        error
      );

      setError(
        "Failed to save job preferences."
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setError("");

      await signOut(auth);
    } catch (error) {
      console.error(
        "Failed to logout:",
        error
      );

      setError("Failed to logout.");
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <LoadingScreen message="Loading your profile..." />
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <button
          className="profile-menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div
          className={`profile-menu-overlay ${
            menuOpen ? "open" : ""
          }`}
          onClick={() => setMenuOpen(false)}
        />

        <aside
          className={`profile-sidebar ${
            menuOpen ? "open" : ""
          }`}
        >
          <div className="profile-sidebar-header">
            <span>Careerly</span>

            <button
              className="profile-menu-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
            >
              ×
            </button>
          </div>

          <nav className="profile-sidebar-nav">
            <Link to="/dashboard">
              Dashboard
            </Link>

            <Link to="/jobs">
              Find Jobs
            </Link>

            <Link to="/saved-jobs">
              Saved Jobs
            </Link>

            <Link to="/applications">
              Applications
            </Link>

            <Link to="/resume">
              Resume
            </Link>

            <Link
              to="/profile"
              className="active"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Profile
            </Link>
          </nav>
        </aside>

        <div className="profile-container">
          <div className="profile-error-card">
            <h2>
              Unable to load profile
            </h2>

            <p>
              {error ||
                "Something went wrong."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <button
        className="profile-menu-button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation"
      >
        ☰
      </button>

      <div
        className={`profile-menu-overlay ${
          menuOpen ? "open" : ""
        }`}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={`profile-sidebar ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="profile-sidebar-header">
          <span>Careerly</span>

          <button
            className="profile-menu-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <nav className="profile-sidebar-nav">
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>

          <Link
            to="/jobs"
            onClick={() => setMenuOpen(false)}
          >
            Find Jobs
          </Link>

          <Link
            to="/saved-jobs"
            onClick={() => setMenuOpen(false)}
          >
            Saved Jobs
          </Link>

          <Link
            to="/applications"
            onClick={() => setMenuOpen(false)}
          >
            Applications
          </Link>

          <Link
            to="/resume"
            onClick={() => setMenuOpen(false)}
          >
            Resume
          </Link>

          <Link
            to="/profile"
            className="active"
            onClick={() => setMenuOpen(false)}
          >
            Profile
          </Link>
        </nav>
      </aside>

      <div className="profile-container">
        <button
          className="profile-back-link"
          onClick={() => {
            window.location.href =
              "/dashboard";
          }}
        >
          ← Dashboard
        </button>

        <div className="profile-heading">
          <div>
            <span className="profile-eyebrow">
              ACCOUNT
            </span>

            <h1>My Profile</h1>

            <p>
              Manage your Careerly account
              and preferences.
            </p>
          </div>
        </div>

        {error && (
          <div className="profile-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="profile-message success">
            {success}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar">
              {(
                user.name ||
                user.email ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h2>
                {user.name ||
                  "Careerly User"}
              </h2>

              <p>{user.email}</p>
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-field">
            <label>Name</label>

            {editing ? (
              <div className="profile-edit-row">
                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your name"
                />

                <button
                  className="profile-primary-button"
                  onClick={
                    handleSaveName
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save"}
                </button>

                <button
                  className="profile-secondary-button"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-value-row">
                <span>
                  {user.name ||
                    "Not provided"}
                </span>

                <button
                  className="profile-edit-button"
                  onClick={() => {
                    setEditing(true);
                    setSuccess("");
                    setError("");
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>Email</label>

            <div className="profile-value">
              {user.email ||
                "Not provided"}
            </div>
          </div>

          <div className="profile-field">
            <label>Account</label>

            <div className="profile-value">
              Careerly account
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-section-title">
            <div>
              <h2>Preferences</h2>

              <p>
                Customize how Careerly
                looks and which jobs are
                recommended to you.
              </p>
            </div>
          </div>

          <div className="preference-row">
            <div>
              <strong>
                Appearance
              </strong>

              <span>
                {darkMode
                  ? "Dark mode"
                  : "Light mode"}
              </span>
            </div>

            <button
              className={`theme-toggle ${
                darkMode
                  ? "active"
                  : ""
              }`}
              onClick={
                handleThemeToggle
              }
              aria-label="Toggle theme"
            >
              <span className="theme-toggle-circle">
                {darkMode
                  ? "☾"
                  : "☀"}
              </span>
            </button>
          </div>

          <div className="job-preferences">
            <div className="job-preferences-heading">
              <h3>
                What are you looking for?
              </h3>

              <p>
                Tell Careerly what kind of
                opportunities work best
                for you.
              </p>
            </div>

            <div className="job-preference-grid">
              <div className="job-preference-field">
                <label htmlFor="work-type">
                  Work Type
                </label>

                <select
                  id="work-type"
                  value={workType}
                  onChange={(event) =>
                    setWorkType(
                      event.target.value
                    )
                  }
                >
                  <option value="Any">
                    Any
                  </option>

                  <option value="Internship">
                    Internship
                  </option>

                  <option value="Part-time">
                    Part-time
                  </option>

                  <option value="Full-time">
                    Full-time
                  </option>

                  <option value="Contract">
                    Contract
                  </option>
                </select>
              </div>

              <div className="job-preference-field">
                <label htmlFor="work-mode">
                  Work Mode
                </label>

                <select
                  id="work-mode"
                  value={workMode}
                  onChange={(event) =>
                    setWorkMode(
                      event.target.value
                    )
                  }
                >
                  <option value="Any">
                    Any
                  </option>

                  <option value="Remote">
                    Remote
                  </option>

                  <option value="Hybrid">
                    Hybrid
                  </option>

                  <option value="On-site">
                    On-site
                  </option>
                </select>
              </div>

              <div className="job-preference-field">
                <label htmlFor="preferred-location">
                  Preferred Location
                </label>

                <input
                  id="preferred-location"
                  type="text"
                  value={preferredLocation}
                  onChange={(event) =>
                    setPreferredLocation(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Bengaluru"
                />

                <span className="field-hint">
                  Optional
                </span>
              </div>

              <div className="job-preference-field">
                <label htmlFor="experience-level">
                  Experience Level
                </label>

                <select
                  id="experience-level"
                  value={experienceLevel}
                  onChange={(event) =>
                    setExperienceLevel(
                      event.target.value
                    )
                  }
                >
                  <option value="Any">
                    Any
                  </option>

                  <option value="Internship">
                    Internship / Student
                  </option>

                  <option value="Entry Level">
                    Entry-level
                  </option>

                  <option value="Mid Level">
                    Mid-level
                  </option>

                  <option value="Senior Level">
                    Senior-level
                  </option>
                </select>
              </div>
            </div>

            <div className="job-preferences-actions">
              <button
                className="profile-primary-button"
                onClick={
                  handleSaveJobPreferences
                }
                disabled={
                  savingPreferences
                }
              >
                {savingPreferences
                  ? "Saving..."
                  : "Save Job Preferences"}
              </button>
            </div>
          </div>
        </div>

        <div className="profile-card security-card">
          <div>
            <h2>
              Account Actions
            </h2>

            <p>
              Sign out of your Careerly
              account on this device.
            </p>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut
              ? "Logging out..."
              : "Log Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;