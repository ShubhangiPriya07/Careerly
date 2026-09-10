import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  getSavedJobs,
  getApplications,
  getRecommendedJobs,
  saveJob,
  deleteSavedJob,
  createApplication,
  deleteApplication,
  saveRecommendationFeedback,
} from "../services/api";

import Navigation from "../components/Navigation";
import LoadingScreen from "../components/LoadingScreen";

import "./Dashboard.css";

const RECOMMENDATIONS_STORAGE_KEY =
  "careerly_recommended_jobs";

const RECOMMENDATIONS_CACHE_DURATION =
  30 * 60 * 1000;

function formatJobType(jobType) {
  if (!jobType) return "";

  if (jobType === "full_time") {
    return "Full-time";
  }

  if (jobType === "part_time") {
    return "Part-time";
  }

  if (jobType === "contract") {
    return "Contract";
  }

  return (
    jobType.charAt(0).toUpperCase() +
    jobType.slice(1)
  );
}

function formatWorkMode(workMode) {
  if (!workMode) return "";

  if (workMode === "on_site") {
    return "On-site";
  }

  return (
    workMode.charAt(0).toUpperCase() +
    workMode.slice(1)
  );
}

function Dashboard() {
  const navigate = useNavigate();

  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedRecommendationIds, setSavedRecommendationIds] =
    useState(new Set());
  const [trackedRecommendationIds, setTrackedRecommendationIds] =
    useState(new Set());

  const [trackingRecommendationId, setTrackingRecommendationId] =
    useState(null);

  const [recommendedJobs, setRecommendedJobs] =
    useState([]);

  const [
    recommendationsLoading,
    setRecommendationsLoading,
  ] = useState(false);

  const [
    recommendationsError,
    setRecommendationsError,
  ] = useState("");

  const [
    hasLoadedRecommendations,
    setHasLoadedRecommendations,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const recommendationsRequestLock = useRef(false);

  // ==================== LOAD DASHBOARD ====================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          savedJobsData,
          applicationsData,
        ] = await Promise.all([
          getSavedJobs(),
          getApplications(),
        ]);

        setSavedJobs(
          savedJobsData.savedJobs || []
        );

        const savedJobsList =
          savedJobsData.savedJobs || [];

        setSavedRecommendationIds(
          new Set(
            savedJobsList.map(
              (job) =>
                `${job.source}-${job.externalId}`
            )
          )
        );

        setApplications(
          applicationsData.applications || []
        );

        const applicationsList =
          applicationsData.applications || [];

        setTrackedRecommendationIds(
          new Set(
            applicationsList
              .filter(
                (application) =>
                  application.source &&
                  application.externalId
              )
              .map(
                (application) =>
                  `${application.source}-${application.externalId}`
              )
          )
        );
      } catch (error) {
        console.error(
          "Failed to load dashboard:",
          error
        );

        setError(
          "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ==================== LOAD CACHED RECOMMENDATIONS ====================

  useEffect(() => {
    try {
      const storedRecommendations =
        localStorage.getItem(
          RECOMMENDATIONS_STORAGE_KEY
        );

      if (!storedRecommendations) {
        return;
      }

      const parsed = JSON.parse(
        storedRecommendations
      );

      if (
        !Array.isArray(
          parsed.recommendations
        )
      ) {
        localStorage.removeItem(
          RECOMMENDATIONS_STORAGE_KEY
        );

        return;
      }

      const isExpired =
        Date.now() - parsed.savedAt >
        RECOMMENDATIONS_CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(
          RECOMMENDATIONS_STORAGE_KEY
        );

        return;
      }

      setRecommendedJobs(
        parsed.recommendations
      );

      setHasLoadedRecommendations(true);
    } catch (error) {
      console.error(
        "Failed to load cached recommendations:",
        error
      );

      localStorage.removeItem(
        RECOMMENDATIONS_STORAGE_KEY
      );
    }
  }, []);

  // ==================== GET AI RECOMMENDATIONS ====================

  const handleGetRecommendations =
    async () => {
      if (recommendationsRequestLock.current) {
        return;
      }

      recommendationsRequestLock.current = true;

      try {
        setRecommendationsLoading(true);
        setRecommendationsError("");

        const response =
          await getRecommendedJobs();

        const recommendations =
          Array.isArray(
            response.recommendations
          )
            ? response.recommendations
            : [];

        setRecommendedJobs(
          recommendations
        );

        setHasLoadedRecommendations(true);

        localStorage.setItem(
          RECOMMENDATIONS_STORAGE_KEY,
          JSON.stringify({
            recommendations,
            savedAt: Date.now(),
          })
        );
      } catch (error) {
        console.error(
          "Failed to load recommended jobs:",
          error
        );

        setRecommendationsError(
          error.response?.data?.message ||
            "Failed to load job recommendations."
        );

        setHasLoadedRecommendations(
          recommendedJobs.length > 0
        );
      } finally {
        recommendationsRequestLock.current = false;
        setRecommendationsLoading(false);
      }
    };

  // ==================== VIEW RECOMMENDED JOB ====================

  const handleViewRecommendedJob = (
    recommendation
  ) => {
    const job = recommendation?.job;

    if (
      !job?.source ||
      !job?.externalId
    ) {
      return;
    }

    sessionStorage.setItem(
      "careerly_selected_external_job",
      JSON.stringify(job)
    );

    navigate(
      `/jobs/external/${job.source}/${job.externalId}`
    );
  };

  const handleSaveRecommendedJob = async (
    recommendation
  ) => {
    const job = recommendation?.job;

    if (!job?.source || !job?.externalId) {
      return;
    }

    const jobKey = `${job.source}-${job.externalId}`;

    try {
      if (savedRecommendationIds.has(jobKey)) {
        const savedJob = savedJobs.find(
          (saved) =>
            saved.source === job.source &&
            String(saved.externalId) ===
              String(job.externalId)
        );

        if (!savedJob?._id) {
          return;
        }

        await deleteSavedJob(savedJob._id);

        setSavedJobs((current) =>
          current.filter(
            (saved) => saved._id !== savedJob._id
          )
        );

        setSavedRecommendationIds((current) => {
          const next = new Set(current);
          next.delete(jobKey);
          return next;
        });

        return;
      }

      const response = await saveJob({
        externalId: job.externalId,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        jobType: job.jobType,
        workMode: job.workMode,
        experienceLevel: job.experienceLevel,
        skills: job.skills,
        salary: job.salary,
        applicationUrl: job.applicationUrl,
        postedAt: job.postedAt,
      });

      if (response?.savedJob) {
        setSavedJobs((current) => [
          ...current,
          response.savedJob,
        ]);
      }

      setSavedRecommendationIds((current) => {
        const next = new Set(current);
        next.add(jobKey);
        return next;
      });
    } catch (error) {
      console.error(
        "Failed to save/unsave recommended job:",
        error
      );
    }
  };

  const handleTrackRecommendedJob = async (
    recommendation
  ) => {
    const job = recommendation?.job;

    if (!job?.source || !job?.externalId) {
      return;
    }

    const jobKey = `${job.source}-${job.externalId}`;

    try {
      setTrackingRecommendationId(jobKey);

      if (trackedRecommendationIds.has(jobKey)) {
        const application = applications.find(
          (item) =>
            item.source === job.source &&
            String(item.externalId) ===
              String(job.externalId)
        );

        if (!application?._id) {
          return;
        }

        await deleteApplication(application._id);

        setApplications((current) =>
          current.filter(
            (item) =>
              item._id !== application._id
          )
        );

        setTrackedRecommendationIds(
          (current) => {
            const next = new Set(current);
            next.delete(jobKey);
            return next;
          }
        );

        return;
      }

      const data = await createApplication({
        externalId: job.externalId,
        source: job.source,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        applicationUrl: job.applicationUrl,
      });

      if (data.application) {
        setApplications((current) => [
          ...current,
          data.application,
        ]);
      }

      setTrackedRecommendationIds(
        (current) => {
          const next = new Set(current);
          next.add(jobKey);
          return next;
        }
      );
    } catch (error) {
      console.error(
        "Failed to track/untrack recommended job:",
        error
      );

      if (error.response?.status === 409) {
        setTrackedRecommendationIds(
          (current) => {
            const next = new Set(current);
            next.add(jobKey);
            return next;
          }
        );
      }
    } finally {
      setTrackingRecommendationId(null);
    }
  };

  const handleNotInterested = async (
    recommendation
  ) => {
    const job = recommendation?.job;

    if (!job?.source || !job?.externalId) {
      return;
    }

    try {
      await saveRecommendationFeedback({
        source: job.source,
        externalId: job.externalId,
        jobTitle: job.title,
        company: job.company,
      });

      setRecommendedJobs((current) =>
        current.filter(
          (item) =>
            !(
              item?.job?.source === job.source &&
              String(item?.job?.externalId) ===
                String(job.externalId)
            )
        )
      );
    } catch (error) {
      console.error(
        "Failed to save recommendation feedback:",
        error
      );
    }
  };

  // ==================== DASHBOARD COUNTS ====================

  const applicationCount =
    applications.length;

  const savedJobsCount =
    savedJobs.length;

  const interviewCount =
    applications.filter(
      (application) =>
        application.status ===
        "Interview"
    ).length;

  const offerCount =
    applications.filter(
      (application) =>
        application.status === "Offer"
    ).length;

  const appliedCount =
    applications.filter(
      (application) =>
        application.status === "Applied"
    ).length;

  const statusGroups = [
    {
      label: "Saved",
      count: savedJobsCount,
    },
    {
      label: "Applied",
      count: appliedCount,
    },
    {
      label: "Interview",
      count: interviewCount,
    },
    {
      label: "Offer",
      count: offerCount,
    },
  ];

  // ==================== UPCOMING APPLICATIONS ====================

  const upcomingApplications =
    applications
      .filter(
        (application) =>
          application.nextStepDate
      )
      .sort(
        (a, b) =>
          new Date(
            a.nextStepDate
          ) -
          new Date(
            b.nextStepDate
          )
      )
      .slice(0, 4);

  // ==================== RENDER ====================

  if (loading) {
    return (
      <LoadingScreen message="Loading your dashboard..." />
    );
  }

  return (
    <div className="dashboard-page">
      <Navigation />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              CAREERLY
            </p>

            <h1>
              Your Career Dashboard
            </h1>

            <p className="dashboard-subtitle">
              Keep your job search organized,
              focused, and moving forward.
            </p>
          </div>

          <Link
            to="/jobs"
            className="dashboard-primary-button"
          >
            Find Jobs
          </Link>
        </header>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        {/* ==================== STATISTICS ==================== */}

        <section className="dashboard-stats">
          <div className="dashboard-stat-card">
            <span>
              Saved Jobs
            </span>

            <strong>
              {savedJobsCount}
            </strong>

            <small>
              Opportunities you're
              considering
            </small>
          </div>

          <div className="dashboard-stat-card">
            <span>
              Applications
            </span>

            <strong>
              {applicationCount}
            </strong>

            <small>
              Applications you're
              tracking
            </small>
          </div>

          <div className="dashboard-stat-card">
            <span>
              Interviews
            </span>

            <strong>
              {interviewCount}
            </strong>

            <small>
              Interviews in your
              pipeline
            </small>
          </div>

          <div className="dashboard-stat-card">
            <span>
              Offers
            </span>

            <strong>
              {offerCount}
            </strong>

            <small>
              Offers received
            </small>
          </div>
        </section>

        {/* ==================== MAIN GRID ==================== */}

        <section className="dashboard-main-grid">
          {/* APPLICATION PIPELINE */}

          <div className="dashboard-card">
            <div className="dashboard-section-heading">
              <div>
                <p className="section-label">
                  APPLICATION PIPELINE
                </p>

                <h2>
                  Where things stand
                </h2>
              </div>

              <Link to="/applications">
                View applications
              </Link>
            </div>

            <div className="progress-list">
              {statusGroups.map(
                (group) => {
                  const percentage =
                    applicationCount >
                      0
                      ? Math.min(
                          100,
                          (group.count /
                            applicationCount) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      className="progress-row"
                      key={
                        group.label
                      }
                    >
                      <div className="progress-row-header">
                        <span>
                          {
                            group.label
                          }
                        </span>

                        <strong>
                          {
                            group.count
                          }
                        </strong>
                      </div>

                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* UPCOMING */}

          <div className="dashboard-card">
            <div className="dashboard-section-heading">
              <div>
                <p className="section-label">
                  NEXT STEPS
                </p>

                <h2>
                  Upcoming
                </h2>
              </div>

              <Link to="/applications">
                View all
              </Link>
            </div>

            {upcomingApplications.length ===
              0 ? (
              <div className="dashboard-empty">
                <div className="empty-icon">
                  +
                </div>

                <h3>
                  Nothing scheduled
                </h3>

                <p>
                  Add a next-step date
                  to an application
                  to see it here.
                </p>
              </div>
            ) : (
              <div className="upcoming-list">
                {upcomingApplications.map(
                  (application) => {
                    const date =
                      new Date(
                        application.nextStepDate
                      );

                    return (
                      <div
                        className="upcoming-item"
                        key={
                          application._id
                        }
                      >
                        <div className="upcoming-date">
                          <strong>
                            {date.toLocaleDateString(
                              "en-US",
                              {
                                month:
                                  "short",
                              }
                            )}
                          </strong>

                          <span>
                            {date.getDate()}
                          </span>
                        </div>

                        <div className="upcoming-details">
                          <h3>
                            {
                              application.jobTitle
                            }
                          </h3>

                          <p>
                            {
                              application.company
                            }
                          </p>

                          <span>
                            {
                              application.nextStep
                            }
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>

        {/* ==================== AI RECOMMENDATIONS ==================== */}

        <section className="dashboard-recommendations">
          <div className="dashboard-section-heading">
            <div>
              <p className="section-label">
                AI RECOMMENDATIONS
              </p>

              <h2>
                Recommended for you
              </h2>

              <p className="recommendations-subtitle">
                Personalized job matches
                based on your resume
              </p>
            </div>

            {hasLoadedRecommendations &&
              !recommendationsLoading && (
                <button
                  className="recommendations-refresh-button"
                  onClick={handleGetRecommendations}
                  title="Refresh AI recommendations"
                >
                  <span className="refresh-icon">↻</span>
                  <span>Refresh</span>
                </button>
              )}
          </div>

          {!hasLoadedRecommendations &&
            !recommendationsLoading && (
              <div className="recommendations-start">
                <div className="recommendations-start-icon">
                  AI
                </div>

                <div className="recommendations-start-content">
                  <h3>
                    Find jobs that match
                    your resume
                  </h3>

                  <p>
                    Careerly will analyze
                    your resume and find
                    real job opportunities
                    that best match your
                    skills and projects.
                  </p>

                  <button
                    className="recommendations-action-button"
                    onClick={
                      handleGetRecommendations
                    }
                    disabled={
                      recommendationsLoading
                    }
                  >
                    Get AI Recommendations
                  </button>
                </div>
              </div>
            )}

          {recommendationsLoading && (
            <div className="recommendations-loading">
              <div className="recommendations-loading-spinner" />

              <div>
                <strong>
                  Finding jobs for
                  you...
                </strong>

                <p>
                  Careerly is analyzing
                  your resume against
                  current opportunities.
                </p>
              </div>
            </div>
          )}

          {recommendationsError &&
            !recommendationsLoading &&
            recommendedJobs.length === 0 && (
              <div className="recommendations-message">
                <h3>
                  Recommendations
                  unavailable
                </h3>

                <p>
                  {
                    recommendationsError
                  }
                </p>

                <button
                  className="recommendations-get-button"
                  onClick={
                    handleGetRecommendations
                  }
                >
                  Try Again
                </button>
              </div>
            )}

          {hasLoadedRecommendations &&
            !recommendationsLoading &&
            !recommendationsError &&
            recommendedJobs.length ===
              0 && (
              <div className="recommendations-message">
                <h3>
                  No recommendations
                  found
                </h3>

                <p>
                  We couldn't find
                  suitable opportunities
                  right now. Try
                  refreshing later.
                </p>
              </div>
            )}

          {hasLoadedRecommendations &&
            !recommendationsLoading &&
            !recommendationsError &&
            recommendedJobs.length >
              0 && (
              <div className="recommended-jobs-grid">
                {recommendedJobs.map(
                  (
                    recommendation,
                    index
                  ) => {
                    const job =
                      recommendation.job;

                    return (
                      <article
                        className="recommended-job-card"
                        key={`${job.source}-${job.externalId}-${index}`}
                      >
                        <div className="recommended-job-header">
                          <div className="recommended-company-mark">
                            {job.company
                              ? job.company
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()
                              : "?"}
                          </div>

                          <div className="recommended-match-score">
                            <strong>
                              {
                                recommendation.matchScore
                              }
                              %
                            </strong>

                            <span>
                              match
                            </span>
                          </div>
                        </div>

                        <button
                          className="recommended-job-title"
                          onClick={() =>
                            handleViewRecommendedJob(
                              recommendation
                            )
                          }
                        >
                          {
                            job.title
                          }
                        </button>

                        {job.company && (
                          <p className="recommended-job-company">
                            {
                              job.company
                            }
                          </p>
                        )}

                        {job.location && (
                          <p className="recommended-job-location">
                            {
                              job.location
                            }
                          </p>
                        )}

                        <div className="recommended-job-tags">
                          {job.jobType && (
                            <span>
                              {formatJobType(
                                job.jobType
                              )}
                            </span>
                          )}

                          {job.workMode && (
                            <span>
                              {formatWorkMode(
                                job.workMode
                              )}
                            </span>
                          )}

                          {job.salary && (
                            <span>
                              {job.salary}
                            </span>
                          )}
                        </div>

                        {recommendation.reason && (
                          <div className="recommended-job-reason">
                            <span>
                              Why it matches
                            </span>

                            <p>
                              {
                                recommendation.reason
                              }
                            </p>
                          </div>
                        )}

                        <button
                          className={`recommended-job-save-button ${
                            savedRecommendationIds.has(
                              `${job.source}-${job.externalId}`
                            )
                              ? "saved"
                              : ""
                          }`}
                          onClick={() =>
                            handleSaveRecommendedJob(
                              recommendation
                            )
                          }
                        >
                          {savedRecommendationIds.has(
                            `${job.source}-${job.externalId}`
                          )
                            ? "Saved"
                            : "Save Job"}
                        </button>

                        <button
                          className={`recommended-job-track-button ${
                            trackedRecommendationIds.has(
                              `${job.source}-${job.externalId}`
                            )
                              ? "tracked"
                              : ""
                          }`}
                          onClick={() =>
                            handleTrackRecommendedJob(
                              recommendation
                            )
                          }
                          disabled={
                            trackingRecommendationId ===
                            `${job.source}-${job.externalId}`
                          }
                        >
                          {trackingRecommendationId ===
                            `${job.source}-${job.externalId}`
                            ? "Updating..."
                            : trackedRecommendationIds.has(
                                `${job.source}-${job.externalId}`
                              )
                              ? "Application Tracked"
                              : "Track Application"}
                        </button>

                        <button
                          className="recommended-job-not-interested-button"
                          onClick={() =>
                            handleNotInterested(
                              recommendation
                            )
                          }
                        >
                          Not Interested
                        </button>

                        <button
                          className="recommended-job-button"
                          onClick={() =>
                            handleViewRecommendedJob(
                              recommendation
                            )
                          }
                        >
                          View Details
                        </button>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;