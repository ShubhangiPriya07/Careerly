import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getApplications,
  updateApplication,
  deleteApplication,
} from "../services/api";

import LoadingScreen from "../components/LoadingScreen";

import "./Applications.css";

const statuses = [
  "All",
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

function Applications() {
  const [applications, setApplications] = useState([]);
  const [activeStatus, setActiveStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getApplications();
      setApplications(data.applications || []);
    } catch (error) {
      console.error(
        "Failed to load applications:",
        error
      );

      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const data = await updateApplication(id, {
        status,
      });

      setApplications((current) =>
        current.map((application) =>
          application._id === id
            ? data.application
            : application
        )
      );
    } catch (error) {
      console.error(error);
      setError(
        "Failed to update application status."
      );
    }
  };

  const handleSaveDetails = async (
    id,
    notes,
    nextStep,
    nextStepDate
  ) => {
    try {
      const data = await updateApplication(id, {
        notes,
        nextStep,
        nextStepDate: nextStepDate || null,
      });

      setApplications((current) =>
        current.map((application) =>
          application._id === id
            ? data.application
            : application
        )
      );
    } catch (error) {
      console.error(error);
      setError(
        "Failed to save application details."
      );
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this application?"
      )
    ) {
      return;
    }

    try {
      await deleteApplication(id);

      setApplications((current) =>
        current.filter(
          (application) =>
            application._id !== id
        )
      );
    } catch (error) {
      console.error(error);
      setError(
        "Failed to delete application."
      );
    }
  };

  const getCount = (status) =>
    status === "All"
      ? applications.length
      : applications.filter(
          (application) =>
            application.status === status
        ).length;

  const filteredApplications =
    activeStatus === "All"
      ? applications
      : applications.filter(
          (application) =>
            application.status === activeStatus
        );

  const interviewCount = getCount("Interview");
  const offerCount = getCount("Offer");

  const interviewRate = applications.length
    ? Math.round(
        (interviewCount /
          applications.length) *
          100
      )
    : 0;

  const offerRate = applications.length
    ? Math.round(
        (offerCount /
          applications.length) *
          100
      )
    : 0;

  if (loading) {
    return (
      <LoadingScreen message="Loading your applications..." />
    );
  }

  return (
    <div className="applications-page">
      {/* HAMBURGER */}

      <button
        className="applications-menu-button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* SIDE MENU */}

      {menuOpen && (
        <div
          className="applications-menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`applications-sidebar ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="applications-sidebar-header">
          <h2>Careerly</h2>

          <button
            className="applications-close-button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        <nav className="applications-nav">
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
          >
            <span>⌂</span>
            Dashboard
          </Link>

          <Link
            to="/jobs"
            onClick={() => setMenuOpen(false)}
          >
            <span>⌕</span>
            Find Jobs
          </Link>

          <Link
            to="/saved-jobs"
            onClick={() => setMenuOpen(false)}
          >
            <span>♡</span>
            Saved Jobs
          </Link>

          <Link
            to="/applications"
            onClick={() => setMenuOpen(false)}
            className="active"
          >
            <span>▣</span>
            Applications
          </Link>

          <Link
            to="/resume"
            onClick={() => setMenuOpen(false)}
          >
            <span>▤</span>
            Resume
          </Link>

          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
          >
            <span>○</span>
            Profile
          </Link>
        </nav>
      </aside>

      <div className="applications-container">
        <button
          className="applications-back-link"
          onClick={() =>
            (window.location.href = "/dashboard")
          }
        >
          ← Dashboard
        </button>

        <header className="applications-header">
          <span className="applications-eyebrow">
            APPLICATIONS
          </span>

          <h1>Application Tracker</h1>

          <p>
            Keep track of every job and internship
            application in one place.
          </p>
        </header>

        <section className="application-stats">
          <StatCard
            label="Total Applications"
            value={applications.length}
          />

          <StatCard
            label="Applied"
            value={getCount("Applied")}
          />

          <StatCard
            label="Screening"
            value={getCount("Screening")}
          />

          <StatCard
            label="Interviews"
            value={getCount("Interview")}
          />

          <StatCard
            label="Offers"
            value={getCount("Offer")}
          />

          <StatCard
            label="Rejected"
            value={getCount("Rejected")}
          />
        </section>

        <section className="application-rates">
          <div className="application-rate-card">
            <span>INTERVIEW RATE</span>

            <strong>{interviewRate}%</strong>

            <p>
              Applications that reached an interview
            </p>
          </div>

          <div className="application-rate-card">
            <span>OFFER RATE</span>

            <strong>{offerRate}%</strong>

            <p>
              Applications that resulted in an offer
            </p>
          </div>
        </section>

        <section className="application-filter-section">
          <div className="application-section-heading">
            <div>
              <span>YOUR APPLICATIONS</span>

              <h2>
                {filteredApplications.length}{" "}
                {filteredApplications.length === 1
                  ? "application"
                  : "applications"}
              </h2>
            </div>
          </div>

          <div className="application-filters">
            {statuses.map((status) => (
              <button
                key={status}
                className={`application-filter-button ${
                  activeStatus === status
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveStatus(status)
                }
              >
                {status}

                <span>
                  {getCount(status)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="applications-error">
            {error}
          </div>
        )}

        {!error &&
          filteredApplications.length === 0 && (
            <div className="applications-empty">
              <div className="applications-empty-icon">
                —
              </div>

              <h2>No applications here</h2>

              <p>
                {activeStatus === "All"
                  ? "You haven't tracked any applications yet."
                  : `No applications in ${activeStatus}.`}
              </p>
            </div>
          )}

        <div className="applications-list">
          {filteredApplications.map(
            (application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                onStatusChange={
                  handleStatusChange
                }
                onSaveDetails={
                  handleSaveDetails
                }
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="application-stat-card">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function ApplicationCard({
  application,
  onStatusChange,
  onSaveDetails,
  onDelete,
}) {
  const [notes, setNotes] = useState(
    application.notes || ""
  );

  const [nextStep, setNextStep] = useState(
    application.nextStep || ""
  );

  const [nextStepDate, setNextStepDate] =
    useState(
      application.nextStepDate
        ? new Date(application.nextStepDate)
            .toISOString()
            .split("T")[0]
        : ""
    );

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    await onSaveDetails(
      application._id,
      notes,
      nextStep,
      nextStepDate
    );

    setSaving(false);
  };

  return (
    <article className="application-card">
      <div className="application-card-header">
        <div className="application-company-mark">
          {application.company
            ? application.company
                .charAt(0)
                .toUpperCase()
            : "?"}
        </div>

        <div className="application-card-title">
          <h2>{application.jobTitle}</h2>

          <p className="application-company">
            {application.company}
          </p>

          {application.location && (
            <p className="application-location">
              {application.location}
            </p>
          )}
        </div>

        <div className="application-card-date">
          <span>APPLIED</span>

          <strong>
            {new Date(
              application.appliedAt
            ).toLocaleDateString()}
          </strong>
        </div>
      </div>

      <div className="application-status-row">
        <label
          htmlFor={`status-${application._id}`}
        >
          Current status
        </label>

        <select
          id={`status-${application._id}`}
          value={application.status}
          onChange={(event) =>
            onStatusChange(
              application._id,
              event.target.value
            )
          }
        >
          {statuses
            .filter(
              (status) => status !== "All"
            )
            .map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
        </select>
      </div>

      <div className="application-details-grid">
        <div className="application-detail">
          <label>Notes</label>

          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Add notes about this application..."
            rows={4}
          />
        </div>

        <div className="application-detail">
          <label>Next step</label>

          <input
            type="text"
            value={nextStep}
            onChange={(event) =>
              setNextStep(event.target.value)
            }
            placeholder="What do you need to do next?"
          />

          <label className="next-date-label">
            Next step date
          </label>

          <input
            type="date"
            value={nextStepDate}
            onChange={(event) =>
              setNextStepDate(
                event.target.value
              )
            }
          />
        </div>
      </div>

      <div className="application-card-actions">
        <button
          className="application-save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Details"}
        </button>

        {application.applicationUrl && (
          <a
            className="application-view-button"
            href={application.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Job →
          </a>
        )}

        <button
          className="application-delete-button"
          onClick={() =>
            onDelete(application._id)
          }
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default Applications;