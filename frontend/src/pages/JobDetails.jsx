import LoadingScreen from "../components/LoadingScreen";
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  saveJob,
  checkSavedJob,
  deleteSavedJob,
  createApplication,
  checkApplication,
  deleteApplication,
  getJobById,
  getExternalJobById,
  getResumes,
  matchJobWithAI,
  tailorResumeWithAI,
  saveTailoredResume,
} from "../services/api";

import "./JobDetails.css";

function JobDetails() {
  const {
    id,
    source,
    externalId,
  } = useParams();

  const location = useLocation();
  const navigate = useNavigate();

  const [job, setJob] = useState(
    location.state?.job || null
  );

  const [loadingJob, setLoadingJob] =
    useState(
      !location.state?.job
    );

  const [saved, setSaved] =
    useState(false);

  const [savedJobId, setSavedJobId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [checkingSaved, setCheckingSaved] =
    useState(true);

  const [tracked, setTracked] =
    useState(false);

  const [applicationId, setApplicationId] =
    useState(null);

  const [tracking, setTracking] =
    useState(false);

  const [
    checkingTracked,
    setCheckingTracked,
  ] = useState(true);

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiAnalysis, setAiAnalysis] =
    useState(null);

  const [aiError, setAiError] =
    useState("");

  const [
    tailorLoading,
    setTailorLoading,
  ] = useState(false);

  const [
    tailoredResume,
    setTailoredResume,
  ] = useState(null);

  const [
    tailorError,
    setTailorError,
  ] = useState("");

  const [
    savingTailoredResume,
    setSavingTailoredResume,
  ] = useState(false);

  const [
    tailoredResumeSaved,
    setTailoredResumeSaved,
  ] = useState(false);

  const [
    tailoredResumeSaveError,
    setTailoredResumeSaveError,
  ] = useState("");

  const [error, setError] =
    useState("");

  // ==================== LOAD JOB ====================

  useEffect(() => {
    const loadJob = async () => {
      if (location.state?.job) {
        setJob(location.state.job);
        setLoadingJob(false);
        return;
      }

      try {
        let data = null;

        if (source && externalId) {
          const storedJob =
            sessionStorage.getItem(
              "careerly_selected_external_job"
            );

          if (storedJob) {
            try {
              const parsedJob =
                JSON.parse(
                  storedJob
                );

              if (
                parsedJob?.source ===
                source &&
                parsedJob?.externalId ===
                externalId
              ) {
                setJob(parsedJob);
                setLoadingJob(false);
                return;
              }
            } catch (error) {
              console.error(
                "Failed to read stored external job:",
                error
              );

              sessionStorage.removeItem(
                "careerly_selected_external_job"
              );
            }
          }

          data =
            await getExternalJobById(
              source,
              externalId
            );
        } else if (id) {
          data =
            await getJobById(id);
        }

        if (
          data?.success &&
          data?.job
        ) {
          setJob(data.job);
        } else {
          setJob(null);
        }
      } catch (error) {
        console.error(
          "Failed to load job:",
          error
        );

        setJob(null);
      } finally {
        setLoadingJob(false);
      }
    };

    loadJob();
  }, [
    id,
    source,
    externalId,
    location.state,
  ]);

  // ==================== CHECK SAVED ====================

  useEffect(() => {
    const checkIfSaved = async () => {
      if (
        !job?.source ||
        !job?.externalId
      ) {
        setCheckingSaved(false);
        return;
      }

      try {
        const data =
          await checkSavedJob(
            job.source,
            job.externalId
          );

        setSaved(
          Boolean(data.saved)
        );

        if (
          data.savedJob?._id
        ) {
          setSavedJobId(
            data.savedJob._id
          );
        } else {
          setSavedJobId(null);
        }
      } catch (error) {
        console.error(
          "Failed to check saved job:",
          error
        );
      } finally {
        setCheckingSaved(false);
      }
    };

    checkIfSaved();
  }, [job]);

  // ==================== CHECK APPLICATION ====================

  useEffect(() => {
    const checkIfTracked = async () => {
      if (
        !job?.source ||
        !job?.externalId
      ) {
        setCheckingTracked(false);
        return;
      }

      try {
        const data =
          await checkApplication(
            job.source,
            job.externalId
          );

        setTracked(
          Boolean(data.tracked)
        );

        if (
          data.application?._id
        ) {
          setApplicationId(
            data.application._id
          );
        } else {
          setApplicationId(null);
        }
      } catch (error) {
        console.error(
          "Failed to check application:",
          error
        );
      } finally {
        setCheckingTracked(false);
      }
    };

    checkIfTracked();
  }, [job]);

  // ==================== AI JOB MATCH ====================

  const handleAIJobMatch =
    async () => {
      if (!job || aiLoading) {
        return;
      }

      setAiLoading(true);
      setAiError("");
      setAiAnalysis(null);

      try {
        const resumeData =
          await getResumes();

        const resumes =
          resumeData.resumes || [];

        if (resumes.length === 0) {
          setAiError(
            "Please upload or create a resume before using AI Job Match."
          );

          return;
        }

        const defaultResume =
          resumes.find(
            (resume) =>
              resume.isDefault
          ) || resumes[0];

        const result =
          await matchJobWithAI(
            defaultResume.parsedData ||
            defaultResume,
            job
          );

        if (
          result.success &&
          result.analysis
        ) {
          setAiAnalysis(
            result.analysis
          );
        } else {
          setAiError(
            result.message ||
            "Failed to analyze this job."
          );
        }
      } catch (error) {
        console.error(
          "AI job match error:",
          error
        );

        setAiError(
          error.response?.data
            ?.message ||
          "Failed to analyze this job. Please try again."
        );
      } finally {
        setAiLoading(false);
      }
    };

  // ==================== AI RESUME TAILORING ====================

  const handleTailorResume =
    async () => {
      if (!job || tailorLoading) {
        return;
      }

      setTailorLoading(true);
      setTailorError("");
      setTailoredResume(null);

      try {
        const resumeData =
          await getResumes();

        const resumes =
          resumeData.resumes || [];

        if (resumes.length === 0) {
          setTailorError(
            "Please upload or create a resume before tailoring it."
          );

          return;
        }

        const defaultResume =
          resumes.find(
            (resume) =>
              resume.isDefault
          ) || resumes[0];

        if (!defaultResume?.parsedData) {
          setTailorError(
            "Your resume does not contain enough structured information to tailor."
          );

          return;
        }

        const result =
          await tailorResumeWithAI(
            job
          );

        if (
          result.success &&
          result.resume
        ) {
          setTailoredResume(
            result.resume
          );
        } else {
          setTailorError(
            result.message ||
            "Failed to tailor your resume."
          );
        }
      } catch (error) {
        console.error(
          "AI resume tailoring error:",
          error
        );

        setTailorError(
          error.response?.data
            ?.message ||
          "Failed to tailor your resume. Please try again."
        );
      } finally {
        setTailorLoading(false);
      }
    };

  // ==================== SAVE TAILORED RESUME ====================

  const handleSaveTailoredResume =
    async () => {
      if (
        !tailoredResume ||
        savingTailoredResume
      ) {
        return;
      }

      setSavingTailoredResume(true);
      setTailoredResumeSaveError("");

      try {
        const result =
          await saveTailoredResume(
            job.title,
            job.company,
            tailoredResume
          );

        if (result.success) {
          setTailoredResumeSaved(true);
        } else {
          setTailoredResumeSaveError(
            result.message ||
            "Failed to save tailored resume."
          );
        }
      } catch (error) {
        console.error(
          "Save tailored resume error:",
          error
        );

        setTailoredResumeSaveError(
          error.response?.data
            ?.message ||
          "Failed to save tailored resume. Please try again."
        );
      } finally {
        setSavingTailoredResume(false);
      }
    };

  // ==================== SAVE / UNSAVE ====================

  const handleSaveToggle =
    async () => {
      if (!job || saving) {
        return;
      }

      setSaving(true);
      setError("");

      try {
        if (saved) {
          if (!savedJobId) {
            const data =
              await checkSavedJob(
                job.source,
                job.externalId
              );

            if (
              data.savedJob?._id
            ) {
              await deleteSavedJob(
                data.savedJob._id
              );
            }
          } else {
            await deleteSavedJob(
              savedJobId
            );
          }

          setSaved(false);
          setSavedJobId(null);

          return;
        }

        const data =
          await saveJob(job);

        setSaved(true);

        if (
          data.savedJob?._id
        ) {
          setSavedJobId(
            data.savedJob._id
          );
        }
      } catch (error) {
        console.error(
          "Failed to save/unsave job:",
          error
        );

        if (
          error.response?.status ===
          409
        ) {
          setSaved(true);

          if (
            error.response?.data
              ?.savedJob?._id
          ) {
            setSavedJobId(
              error.response.data
                .savedJob._id
            );
          }
        } else {
          setError(
            saved
              ? "Failed to unsave this job."
              : "Failed to save this job."
          );
        }
      } finally {
        setSaving(false);
      }
    };

  // ==================== TRACK / UNTRACK ====================

  const handleTrackToggle =
    async () => {
      if (!job || tracking) {
        return;
      }

      setTracking(true);
      setError("");

      try {
        if (tracked) {
          if (!applicationId) {
            const data =
              await checkApplication(
                job.source,
                job.externalId
              );

            if (
              data.application?._id
            ) {
              await deleteApplication(
                data.application._id
              );
            }
          } else {
            await deleteApplication(
              applicationId
            );
          }

          setTracked(false);
          setApplicationId(null);

          return;
        }

        const data =
          await createApplication({
            externalId:
              job.externalId,
            source: job.source,
            jobTitle: job.title,
            company: job.company,
            location: job.location,
            applicationUrl:
              job.applicationUrl,
          });

        setTracked(true);

        if (
          data.application?._id
        ) {
          setApplicationId(
            data.application._id
          );
        }
      } catch (error) {
        console.error(
          "Failed to track/untrack application:",
          error
        );

        if (
          error.response?.status ===
          409
        ) {
          setTracked(true);

          if (
            error.response?.data
              ?.application?._id
          ) {
            setApplicationId(
              error.response.data
                .application._id
            );
          }
        } else {
          setError(
            tracked
              ? "Failed to untrack this application."
              : "Failed to track this application."
          );
        }
      } finally {
        setTracking(false);
      }
    };

  // ==================== LOADING ====================

  if (loadingJob) {
    return (
      <LoadingScreen message="Loading job details..." />
    );
  }

  // ==================== NOT FOUND ====================

  if (!job) {
    return (
      <div className="job-details-page">
        <div className="job-error-card">
          <h2>
            Job details unavailable
          </h2>

          <p>
            We couldn't find the
            details for this job.
          </p>

          <button
            type="button"
            className="job-back-link"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ==================== PAGE ====================

  return (
    <div className="job-details-page">
      <div className="job-details-container">

        <button
          type="button"
          className="job-back-link"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="job-header-card">
          <div className="job-header-content">

            <span className="job-label">
              JOB DETAILS
            </span>

            <h1>
              {job.title}
            </h1>

            <h2>
              {job.company}
            </h2>

            {job.location && (
              <p className="job-location">
                📍 {job.location}
              </p>
            )}

            {job.experienceLevel && (
              <div className="job-header-experience">
                {job.experienceLevel}
              </div>
            )}

          </div>

          <div className="job-actions">

            <button
              className={`save-job-button ${saved ? "saved" : ""
                }`}
              onClick={
                handleSaveToggle
              }
              disabled={
                saving ||
                checkingSaved
              }
            >
              {checkingSaved
                ? "Checking..."
                : saving
                  ? saved
                    ? "Unsaving..."
                    : "Saving..."
                  : saved
                    ? "Unsave Job"
                    : "Save Job"}
            </button>

            <button
              className={`track-job-button ${tracked
                ? "tracked"
                : ""
                }`}
              onClick={
                handleTrackToggle
              }
              disabled={
                tracking ||
                checkingTracked
              }
            >
              {checkingTracked
                ? "Checking..."
                : tracking
                  ? tracked
                    ? "Untracking..."
                    : "Tracking..."
                  : tracked
                    ? "Untrack Application"
                    : "Track Application"}
            </button>

            <button
              className="ai-match-button"
              onClick={
                handleAIJobMatch
              }
              disabled={aiLoading}
            >
              {aiLoading
                ? "Analyzing..."
                : "✦ Analyze My Match"}
            </button>

            <button
              className="ai-match-button"
              onClick={
                handleTailorResume
              }
              disabled={
                tailorLoading
              }
            >
              {tailorLoading
                ? "Tailoring..."
                : "✦ Tailor My Resume"}
            </button>

          </div>
        </div>

        {error && (
          <div className="job-error-message">
            {error}
          </div>
        )}

        {aiError && (
          <div className="job-error-message">
            {aiError}
          </div>
        )}

        {tailorError && (
          <div className="job-error-message">
            {tailorError}
          </div>
        )}

        {aiAnalysis && (
          <section className="ai-match-card">

            <div className="ai-match-top">

              <div className="ai-match-title-area">

                <div className="ai-match-icon">
                  ✦
                </div>

                <div>
                  <span className="ai-match-eyebrow">
                    CAREERLY AI
                  </span>

                  <h2>
                    AI Match Analysis
                  </h2>

                  <p>
                    Here's how your
                    profile compares
                    with this
                    opportunity.
                  </p>
                </div>

              </div>

              <span className="ai-powered-label">
                AI POWERED
              </span>

            </div>

            <div className="ai-match-body">

              <div className="ai-score-panel">

                <h3>
                  Match Score
                </h3>

                <div className="ai-score-circle">
                  <strong>
                    {
                      aiAnalysis.matchScore
                    }
                  </strong>

                  <span>
                    / 100
                  </span>
                </div>

                <div className="ai-match-summary">
                  <div className="ai-summary-dot" />

                  <div>
                    <strong>
                      {
                        aiAnalysis.matchLabel ||
                        "Match"
                      }
                    </strong>

                    <p>
                      {
                        aiAnalysis.matchSummary
                      }
                    </p>
                  </div>
                </div>

              </div>

              <div className="ai-analysis-details">

                <div className="ai-analysis-item matching">
                  <div className="ai-item-icon">
                    ✓
                  </div>

                  <div>
                    <h3>
                      Matching Skills
                    </h3>

                    <p>
                      {aiAnalysis.matchingSkills?.length
                        ? aiAnalysis.matchingSkills.join(
                          ", "
                        )
                        : "No matching skills identified."}
                    </p>
                  </div>
                </div>

                <div className="ai-analysis-item missing">
                  <div className="ai-item-icon">
                    −
                  </div>

                  <div>
                    <h3>
                      Missing Skills
                    </h3>

                    <p>
                      {aiAnalysis.missingSkills?.length
                        ? aiAnalysis.missingSkills.join(
                          ", "
                        )
                        : "No major missing skills identified."}
                    </p>
                  </div>
                </div>

                <div className="ai-analysis-item strengths">
                  <div className="ai-item-icon">
                    ★
                  </div>

                  <div>
                    <h3>
                      Strengths
                    </h3>

                    <p>
                      {aiAnalysis.strengths?.length
                        ? aiAnalysis.strengths.join(
                          ", "
                        )
                        : "No specific strengths identified."}
                    </p>
                  </div>
                </div>

                <div className="ai-analysis-item recommendation">
                  <div className="ai-item-icon">
                    ●
                  </div>

                  <div>
                    <h3>
                      Recommendation
                    </h3>

                    <p>
                      {
                        aiAnalysis.recommendation ||
                        "Review the role requirements carefully before applying."
                      }
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </section>
        )}

        {tailoredResume && (
          <section className="ai-match-card">

            <div className="ai-match-top">

              <div className="ai-match-title-area">

                <div className="ai-match-icon">
                  ✦
                </div>

                <div>
                  <span className="ai-match-eyebrow">
                    CAREERLY AI
                  </span>

                  <h2>
                    Tailored Resume
                  </h2>

                  <p>
                    Your resume has been
                    tailored specifically
                    for this opportunity.
                  </p>
                </div>

              </div>

              <span className="ai-powered-label">
                AI POWERED
              </span>

            </div>

            <div
              style={{
                padding: "28px",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "24px",
                }}
              >
                <button
                  className="ai-match-button"
                  onClick={
                    handleSaveTailoredResume
                  }
                  disabled={
                    savingTailoredResume ||
                    tailoredResumeSaved
                  }
                >
                  {savingTailoredResume
                    ? "Saving..."
                    : tailoredResumeSaved
                      ? "✓ Resume Saved"
                      : "Save Tailored Resume"}
                </button>
              </div>

              {tailoredResumeSaveError && (
                <div
                  className="job-error-message"
                  style={{
                    marginBottom: "20px",
                  }}
                >
                  {tailoredResumeSaveError}
                </div>
              )}

              {tailoredResume.summary && (
                <div
                  className="ai-analysis-item matching"
                  style={{
                    marginBottom: "18px",
                  }}
                >
                  <div className="ai-item-icon">
                    ✓
                  </div>

                  <div>
                    <h3>
                      Professional Summary
                    </h3>

                    <p>
                      {
                        tailoredResume.summary
                      }
                    </p>
                  </div>
                </div>
              )}

              <div
                className="ai-analysis-item matching"
                style={{
                  marginBottom: "18px",
                }}
              >
                <div className="ai-item-icon">
                  ✓
                </div>

                <div>
                  <h3>
                    Skills
                  </h3>

                  <p>
                    {tailoredResume.skills?.length
                      ? tailoredResume.skills.join(
                        ", "
                      )
                      : "No skills available."}
                  </p>
                </div>
              </div>

              {tailoredResume.experience?.length >
                0 && (
                  <div
                    className="ai-analysis-item strengths"
                    style={{
                      marginBottom: "18px",
                    }}
                  >
                    <div className="ai-item-icon">
                      ★
                    </div>

                    <div>
                      <h3>
                        Experience
                      </h3>

                      {tailoredResume.experience.map(
                        (
                          experienceItem,
                          index
                        ) => (
                          <div
                            key={index}
                            style={{
                              marginBottom:
                                "14px",
                            }}
                          >
                            <strong>
                              {
                                experienceItem.role
                              }
                              {experienceItem.company
                                ? ` · ${experienceItem.company}`
                                : ""}
                            </strong>

                            {experienceItem.description && (
                              <p>
                                {
                                  experienceItem.description
                                }
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {tailoredResume.projects?.length >
                0 && (
                  <div
                    className="ai-analysis-item strengths"
                    style={{
                      marginBottom: "18px",
                    }}
                  >
                    <div className="ai-item-icon">
                      ★
                    </div>

                    <div>
                      <h3>
                        Projects
                      </h3>

                      {tailoredResume.projects.map(
                        (
                          project,
                          index
                        ) => (
                          <div
                            key={index}
                            style={{
                              marginBottom:
                                "14px",
                            }}
                          >
                            <strong>
                              {
                                project.name
                              }
                            </strong>

                            {project.description && (
                              <p>
                                {
                                  project.description
                                }
                              </p>
                            )}

                            {project.technologies?.length >
                              0 && (
                                <p>
                                  <strong>
                                    Technologies:
                                  </strong>{" "}
                                  {
                                    project.technologies.join(
                                      ", "
                                    )
                                  }
                                </p>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {tailoredResume.education?.length >
                0 && (
                  <div
                    className="ai-analysis-item recommendation"
                    style={{
                      marginBottom: "18px",
                    }}
                  >
                    <div className="ai-item-icon">
                      ●
                    </div>

                    <div>
                      <h3>
                        Education
                      </h3>

                      {tailoredResume.education.map(
                        (
                          educationItem,
                          index
                        ) => (
                          <div
                            key={index}
                            style={{
                              marginBottom:
                                "14px",
                            }}
                          >
                            <strong>
                              {
                                educationItem.degree
                              }
                              {educationItem.field
                                ? ` · ${educationItem.field}`
                                : ""}
                            </strong>

                            {educationItem.institution && (
                              <p>
                                {
                                  educationItem.institution
                                }
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {tailoredResume.changes?.length >
                0 && (
                  <div
                    className="ai-analysis-item matching"
                    style={{
                      marginTop: "24px",
                    }}
                  >
                    <div className="ai-item-icon">
                      ✓
                    </div>

                    <div>
                      <h3>
                        What Careerly Changed
                      </h3>

                      <ul
                        style={{
                          margin:
                            "8px 0 0 18px",
                          padding: 0,
                        }}
                      >
                        {tailoredResume.changes.map(
                          (
                            change,
                            index
                          ) => (
                            <li
                              key={index}
                              style={{
                                marginBottom:
                                  "6px",
                              }}
                            >
                              {change}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}

            </div>

          </section>
        )}

        <div className="job-info-grid">

          {job.jobType && (
            <div className="job-info-card">
              <span>
                Job Type
              </span>

              <strong>
                {job.jobType}
              </strong>
            </div>
          )}

          {job.workMode && (
            <div className="job-info-card">
              <span>
                Work Mode
              </span>

              <strong>
                {job.workMode}
              </strong>
            </div>
          )}

          {job.experienceLevel && (
            <div className="job-info-card">
              <span>
                Experience
              </span>

              <strong>
                {
                  job.experienceLevel
                }
              </strong>
            </div>
          )}

          {job.salary && (
            <div className="job-info-card">
              <span>
                Salary
              </span>

              <strong>
                {job.salary}
              </strong>
            </div>
          )}

          {job.postedAt && (
            <div className="job-info-card">
              <span>
                Posted
              </span>

              <strong>
                {new Date(
                  job.postedAt
                ).toLocaleDateString()}
              </strong>
            </div>
          )}

        </div>

        <div className="job-description-card">

          <div className="section-heading">
            <h2>
              Job Description
            </h2>

            <span />
          </div>

          <div className="job-description">
            {job.description ? (
              job.description
                .split("\n")
                .map(
                  (
                    paragraph,
                    index
                  ) => (
                    <p key={index}>
                      {paragraph}
                    </p>
                  )
                )
            ) : (
              <p className="no-description">
                No description
                available for this
                job.
              </p>
            )}
          </div>

        </div>

        {job.applicationUrl && (
          <div className="apply-card">

            <div>
              <h2>
                Interested in this
                job?
              </h2>

              <p>
                Visit the original
                job listing to apply.
              </p>
            </div>

            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="apply-button"
            >
              View & Apply →
            </a>

          </div>
        )}

      </div>
    </div>
  );
}

export default JobDetails;