import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExternalJobs } from "../services/api";
import Navigation from "../components/Navigation";
import "./Jobs.css";

const JOBS_STORAGE_KEY = "careerly_jobs_search";

const formatPostedDate = (postedAt) => {
  if (!postedAt) return "";

  const postedDate = new Date(postedAt);

  if (Number.isNaN(postedDate.getTime())) {
    return "";
  }

  const now = new Date();
  const differenceInMs = now - postedDate;
  const differenceInDays = Math.floor(
    differenceInMs / (1000 * 60 * 60 * 24)
  );

  if (differenceInDays <= 0) {
    return "Posted today";
  }

  if (differenceInDays === 1) {
    return "Posted 1 day ago";
  }

  if (differenceInDays < 30) {
    return `Posted ${differenceInDays} days ago`;
  }

  const differenceInMonths = Math.floor(
    differenceInDays / 30
  );

  if (differenceInMonths === 1) {
    return "Posted 1 month ago";
  }

  return `Posted ${differenceInMonths} months ago`;
};

const formatJobType = (jobType) => {
  if (!jobType) return "";

  if (jobType === "full_time") {
    return "Full-time";
  }

  if (jobType === "part_time") {
    return "Part-time";
  }

  if (jobType === "on_site") {
    return "On-site";
  }

  return (
    jobType.charAt(0).toUpperCase() +
    jobType.slice(1)
  );
};

const formatWorkMode = (workMode) => {
  if (!workMode) return "";

  if (workMode === "on_site") {
    return "On-site";
  }

  return (
    workMode.charAt(0).toUpperCase() +
    workMode.slice(1)
  );
};

function Jobs() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const navigate = useNavigate();

  // ==================== RESTORE PREVIOUS SEARCH ====================

  useEffect(() => {
    try {
      const savedSearch = sessionStorage.getItem(
        JOBS_STORAGE_KEY
      );

      if (!savedSearch) {
        return;
      }

      const savedData = JSON.parse(savedSearch);

      setSearch(savedData.search || "");
      setLocation(savedData.location || "");
      setJobType(savedData.jobType || "");
      setWorkMode(savedData.workMode || "");
      setSortBy(savedData.sortBy || "relevance");

      setJobs(
        Array.isArray(savedData.jobs)
          ? savedData.jobs
          : []
      );

      setPage(savedData.page || 1);
      setHasMore(Boolean(savedData.hasMore));
      setHasSearched(Boolean(savedData.hasSearched));
    } catch (error) {
      console.error(
        "Failed to restore job search:",
        error
      );

      sessionStorage.removeItem(
        JOBS_STORAGE_KEY
      );
    }
  }, []);

  // ==================== SAVE SEARCH STATE ====================

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    try {
      sessionStorage.setItem(
        JOBS_STORAGE_KEY,
        JSON.stringify({
          search,
          location,
          jobType,
          workMode,
          sortBy,
          jobs,
          page,
          hasMore,
          hasSearched,
        })
      );
    } catch (error) {
      console.error(
        "Failed to save job search:",
        error
      );
    }
  }, [
    search,
    location,
    jobType,
    workMode,
    sortBy,
    jobs,
    page,
    hasMore,
    hasSearched,
  ]);

  // ==================== SEARCH JOBS ====================

  const handleSearch = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setHasSearched(true);
    setPage(1);
    setJobs([]);

    try {
      const data = await getExternalJobs({
        search,
        location,
        jobType,
        workMode,
        sortBy,
        page: 1,
        limit: 20,
      });

      setJobs(data.jobs || []);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error(
        "Failed to fetch jobs:",
        error
      );

      setError(
        "Failed to fetch jobs. Please try again."
      );

      setJobs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOAD MORE ====================

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;

    setLoadingMore(true);
    setError("");

    try {
      const data = await getExternalJobs({
        search,
        location,
        jobType,
        workMode,
        sortBy,
        page: nextPage,
        limit: 20,
      });

      const newJobs = data.jobs || [];

      setJobs((currentJobs) => {
        const existingIds = new Set(
          currentJobs.map(
            (job) =>
              `${job.source}-${job.externalId}`
          )
        );

        const uniqueNewJobs = newJobs.filter(
          (job) =>
            !existingIds.has(
              `${job.source}-${job.externalId}`
            )
        );

        return [
          ...currentJobs,
          ...uniqueNewJobs,
        ];
      });

      setPage(nextPage);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error(
        "Failed to load more jobs:",
        error
      );

      setError(
        "Failed to load more jobs. Please try again."
      );
    } finally {
      setLoadingMore(false);
    }
  };

  // ==================== SORT JOBS ====================

  const handleSortChange = async (event) => {
    const newSortBy = event.target.value;

    setSortBy(newSortBy);
    setPage(1);
    setJobs([]);
    setLoading(true);
    setError("");

    try {
      const data = await getExternalJobs({
        search,
        location,
        jobType,
        workMode,
        sortBy: newSortBy,
        page: 1,
        limit: 20,
      });

      setJobs(data.jobs || []);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error(
        "Failed to sort jobs:",
        error
      );

      setError(
        "Failed to update job sorting."
      );

      setJobs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // ==================== VIEW JOB ====================

  const handleViewJob = (job) => {
    if (!job?.source || !job?.externalId) {
      return;
    }

    const storageKey = `careerly_job_${job.source}_${job.externalId}`;

    sessionStorage.setItem(
      storageKey,
      JSON.stringify(job)
    );

    navigate(
      `/jobs/external/${encodeURIComponent(
        job.source
      )}/${encodeURIComponent(job.externalId)}`,
      {
        state: { job },
      }
    );
  };

  // ==================== RENDER ====================

  return (
    <div className="jobs-page">
      <div className="jobs-container">
        <div className="jobs-topbar">
          <Navigation />

          <button
            className="jobs-back-link"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        <header className="jobs-header">
          <span className="jobs-eyebrow">
            OPPORTUNITIES
          </span>

          <h1>Find your next opportunity</h1>

          <p>
            Search for jobs and internships that match
            your skills and interests.
          </p>
        </header>

        <section className="jobs-search-card">
          <form onSubmit={handleSearch}>
            <div className="jobs-search-fields">
              <div className="jobs-input-group">
                <label htmlFor="job-search">
                  Search
                </label>

                <input
                  id="job-search"
                  type="text"
                  placeholder="Job title, skills or keywords"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <div className="jobs-input-group">
                <label htmlFor="job-location">
                  Location
                </label>

                <input
                  id="job-location"
                  type="text"
                  placeholder="City, state or remote"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                />
              </div>

              <div className="jobs-input-group">
                <label htmlFor="job-type">
                  Job Type
                </label>

                <select
                  id="job-type"
                  value={jobType}
                  onChange={(event) =>
                    setJobType(event.target.value)
                  }
                >
                  <option value="">
                    All job types
                  </option>

                  <option value="internship">
                    Internship
                  </option>

                  <option value="full_time">
                    Full-time
                  </option>

                  <option value="part_time">
                    Part-time
                  </option>

                  <option value="contract">
                    Contract
                  </option>
                </select>
              </div>

              <div className="jobs-input-group">
                <label htmlFor="work-mode">
                  Work Mode
                </label>

                <select
                  id="work-mode"
                  value={workMode}
                  onChange={(event) =>
                    setWorkMode(event.target.value)
                  }
                >
                  <option value="">
                    All work modes
                  </option>

                  <option value="remote">
                    Remote
                  </option>

                  <option value="hybrid">
                    Hybrid
                  </option>

                  <option value="on_site">
                    On-site
                  </option>
                </select>
              </div>

              <button
                className="jobs-search-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Searching..."
                  : "Search Jobs"}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div className="jobs-message error">
            {error}
          </div>
        )}

        {/* SEARCH LOADING */}

        {loading && (
          <div className="jobs-loading">
            <div className="jobs-loading-spinner">
              <span />
              <span />
              <span />
            </div>

            <div>
              <strong>
                Finding opportunities...
              </strong>

              <p>
                Searching for jobs that match your
                criteria.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          hasSearched &&
          jobs.length === 0 &&
          !error && (
            <div className="jobs-empty">
              <div className="jobs-empty-icon">
                —
              </div>

              <h2>No jobs found</h2>

              <p>
                Try changing your keywords or location
                and search again.
              </p>
            </div>
          )}

        {!loading && jobs.length > 0 && (
          <div className="jobs-results-header">
            <div>
              <span className="jobs-results-label">
                SEARCH RESULTS
              </span>

              <h2>
                {jobs.length}{" "}
                {jobs.length === 1
                  ? "opportunity"
                  : "opportunities"}{" "}
                found
              </h2>

              <div className="jobs-search-context">
                {search && (
                  <span>{search}</span>
                )}

                {location && (
                  <span>{location}</span>
                )}

                {jobType && (
                  <span>
                    {formatJobType(jobType)}
                  </span>
                )}

                {workMode && (
                  <span>
                    {formatWorkMode(workMode)}
                  </span>
                )}
              </div>
            </div>

            <div className="jobs-sort-group">
              <label htmlFor="jobs-sort">
                Sort by
              </label>

              <select
                id="jobs-sort"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="relevance">
                  Relevance
                </option>

                <option value="newest">
                  Newest
                </option>

                <option value="salary_high">
                  Salary — High to Low
                </option>

                <option value="salary_low">
                  Salary — Low to High
                </option>
              </select>
            </div>
          </div>
        )}

        <div className="jobs-grid">
          {jobs.map((job) => (
            <article
              className="job-card"
              key={`${job.source}-${job.externalId}`}
            >
              <div className="job-card-top">
                <div className="job-company-mark">
                  {job.company
                    ? job.company
                        .charAt(0)
                        .toUpperCase()
                    : "?"}
                </div>

                {job.source && (
                  <span className="job-source">
                    {job.source.toUpperCase()}
                  </span>
                )}
              </div>

              <button
                className="job-title-button"
                onClick={() =>
                  handleViewJob(job)
                }
              >
                {job.title}
              </button>

              {job.company && (
                <p className="job-company">
                  {job.company}
                </p>
              )}

              {job.location && (
                <p className="job-location">
                  {job.location}
                </p>
              )}

              <div className="job-tags">
                {job.jobType && (
                  <span>
                    {formatJobType(job.jobType)}
                  </span>
                )}

                {job.workMode && (
                  <span>
                    {formatWorkMode(job.workMode)}
                  </span>
                )}

                {formatPostedDate(job.postedAt) && (
                  <span>
                    {formatPostedDate(job.postedAt)}
                  </span>
                )}
              </div>

              {job.salary && (
                <div className="job-meta">
                  <span className="job-salary">
                    {job.salary}
                  </span>
                </div>
              )}

              {job.description && (
                <p className="job-description">
                  {job.description.slice(0, 220)}

                  {job.description.length > 220
                    ? "..."
                    : ""}
                </p>
              )}

              <div className="job-card-actions">
                <button
                  className="job-view-button"
                  onClick={() =>
                    handleViewJob(job)
                  }
                >
                  View Details
                </button>

                {job.applicationUrl && (
                  <a
                    className="job-apply-link"
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {hasSearched &&
          jobs.length > 0 &&
          hasMore && (
            <div className="jobs-load-more">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="jobs-load-more-button"
              >
                {loadingMore
                  ? "Loading more..."
                  : "Load More Jobs"}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

export default Jobs;