import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../config/firebase";

import {
  getSavedJobs,
  deleteSavedJob,
} from "../services/api";

import LoadingScreen from "../components/LoadingScreen";

import "./SavedJobs.css";

function SavedJobs() {
  const navigate = useNavigate();

  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setSavedJobs([]);
          setLoading(false);
          setError(
            "Please log in to view saved jobs."
          );
          return;
        }

        try {
          setLoading(true);
          setError("");

          const data = await getSavedJobs();

          setSavedJobs(data.savedJobs || []);
        } catch (error) {
          console.error(
            "Failed to load saved jobs:",
            error
          );

          setError("Failed to load saved jobs.");
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRemove = async (id) => {
    try {
      await deleteSavedJob(id);

      setSavedJobs((currentJobs) =>
        currentJobs.filter(
          (job) => job._id !== id
        )
      );
    } catch (error) {
      console.error(
        "Failed to remove saved job:",
        error
      );

      setError("Failed to remove saved job.");
    }
  };

  if (loading) {
    return (
      <LoadingScreen message="Loading your saved jobs..." />
    );
  }

  return (
    <div className="saved-jobs-page">

      {/* HAMBURGER */}

      <button
        className="saved-menu-button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* MENU OVERLAY */}

      {menuOpen && (
        <div
          className="saved-menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`saved-sidebar ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="saved-sidebar-header">
          <h2>Careerly</h2>

          <button
            className="saved-close-button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        <nav className="saved-nav">

          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
          >
            <span className="saved-nav-icon">
              ⌂
            </span>

            <span>Dashboard</span>
          </Link>

          <Link
            to="/jobs"
            onClick={() => setMenuOpen(false)}
          >
            <span className="saved-nav-icon">
              ⌕
            </span>

            <span>Find Jobs</span>
          </Link>

          <Link
            to="/saved-jobs"
            onClick={() => setMenuOpen(false)}
            className="active"
          >
            <span className="saved-nav-icon">
              ♡
            </span>

            <span>Saved Jobs</span>
          </Link>

          <Link
            to="/applications"
            onClick={() => setMenuOpen(false)}
          >
            <span className="saved-nav-icon">
              ▣
            </span>

            <span>Applications</span>
          </Link>

          <Link
            to="/resume"
            onClick={() => setMenuOpen(false)}
          >
            <span className="saved-nav-icon">
              ▤
            </span>

            <span>Resume</span>
          </Link>

          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
          >
            <span className="saved-nav-icon">
              ○
            </span>

            <span>Profile</span>
          </Link>

        </nav>
      </aside>

      {/* MAIN CONTENT */}

      <div className="saved-jobs-container">

        <button
          className="saved-back-link"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <div className="saved-jobs-header">
          <div>
            <p className="saved-jobs-eyebrow">
              CAREERLY
            </p>

            <h1>Saved Jobs</h1>

            <p className="saved-jobs-subtitle">
              Keep your interesting opportunities
              in one place.
            </p>
          </div>

          <div className="saved-jobs-count">
            <span>{savedJobs.length}</span>

            <small>
              {savedJobs.length === 1
                ? "saved job"
                : "saved jobs"}
            </small>
          </div>
        </div>

        {error && (
          <div className="saved-jobs-error">
            {error}
          </div>
        )}

        {!error && savedJobs.length === 0 && (
          <div className="saved-jobs-empty">
            <div className="empty-icon">
              ☆
            </div>

            <h2>No saved jobs yet</h2>

            <p>
              Jobs you save will appear here so you
              can easily come back to them later.
            </p>

            <button
              onClick={() => navigate("/jobs")}
              className="browse-jobs-button"
            >
              Browse Jobs
            </button>
          </div>
        )}

        <div className="saved-jobs-grid">
          {savedJobs.map((job) => (
            <div
              className="saved-job-card"
              key={job._id}
            >
              <div className="saved-job-top">
                <div className="company-placeholder">
                  {job.company
                    ? job.company
                        .charAt(0)
                        .toUpperCase()
                    : "?"}
                </div>

                <span className="saved-label">
                  SAVED
                </span>
              </div>

              <h2>{job.title}</h2>

              <p className="saved-job-company">
                {job.company}
              </p>

              {job.location && (
                <p className="saved-job-location">
                  {job.location}
                </p>
              )}

              <div className="saved-job-tags">
                {job.jobType && (
                  <span>{job.jobType}</span>
                )}

                {job.workMode && (
                  <span>{job.workMode}</span>
                )}

                {job.salary && (
                  <span>{job.salary}</span>
                )}
              </div>

              <div className="saved-job-actions">

                <button
                  className="view-job-button"
                  onClick={() =>
                    navigate(
                      `/jobs/external/${job.source}/${job.externalId}`
                    )
                  }
                >
                  View Job
                </button>

                {job.applicationUrl && (
                  <a
                    className="apply-button"
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply
                  </a>
                )}

                <button
                  className="remove-job-button"
                  onClick={() =>
                    handleRemove(job._id)
                  }
                >
                  Remove
                </button>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default SavedJobs;