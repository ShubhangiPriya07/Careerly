const axios = require("axios");

const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api";

// =========================================
// ADZUNA REQUEST WITH RETRY
// =========================================

const isTransientAdzunaError = (error) => {
  const transientCodes = [
    "ECONNRESET",
    "ECONNABORTED",
    "ETIMEDOUT",
    "EPIPE",
  ];

  if (transientCodes.includes(error?.code)) {
    return true;
  }

  const message = (
    error?.message || ""
  ).toLowerCase();

  return (
    message.includes("socket hang up") ||
    message.includes("network error") ||
    message.includes("timeout")
  );
};

const getAdzuna = async (
  url,
  config,
  maxAttempts = 2
) => {
  let lastError;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      return await axios.get(url, config);
    } catch (error) {
      lastError = error;

      if (
        attempt < maxAttempts &&
        isTransientAdzunaError(error)
      ) {
        console.warn(
          `Adzuna request failed temporarily. Retrying (${attempt}/${maxAttempts - 1})...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );
      } else {
        break;
      }
    }
  }

  throw lastError;
};

// =========================================
// WORK MODE DETECTION
// =========================================

const detectWorkMode = (job) => {
  const title = job.title || "";
  const description = job.description || "";

  const text = `${title} ${description}`.toLowerCase();

  const hybridPatterns = [
    "hybrid",
    "remote/hybrid",
    "hybrid/remote",
    "work from home and office",
    "part remote",
    "partly remote",
  ];

  const remotePatterns = [
    "remote",
    "work from home",
    "working from home",
    "wfh",
    "fully remote",
    "100% remote",
    "remote working",
  ];

  const hasHybrid = hybridPatterns.some(
    (pattern) => text.includes(pattern)
  );

  const hasRemote = remotePatterns.some(
    (pattern) => text.includes(pattern)
  );

  if (hasHybrid) {
    return "hybrid";
  }

  if (hasRemote) {
    return "remote";
  }

  return "on_site";
};

// =========================================
// INTERNSHIP DETECTION
// =========================================

const detectInternship = (job) => {
  const title = job.title || "";
  const description = job.description || "";
  const contractType = job.contract_type || "";

  const text = `${title} ${description} ${contractType}`
    .toLowerCase();

  const internshipPatterns = [
    "intern",
    "internship",
    "student placement",
    "graduate internship",
    "summer internship",
    "industrial training",
    "trainee",
  ];

  return internshipPatterns.some(
    (pattern) => text.includes(pattern)
  );
};

// =========================================
// EXPERIENCE LEVEL DETECTION
// =========================================

const detectExperienceLevel = (job) => {
  const title = job.title || "";
  const description = job.description || "";

  const text = `${title} ${description}`.toLowerCase();

  /*
   * Internship / student roles
   */
  if (
    text.includes("intern") ||
    text.includes("internship") ||
    text.includes("student placement") ||
    text.includes("industrial training")
  ) {
    return "Internship";
  }

  /*
   * Entry-level signals
   */
  const entryLevelPatterns = [
    "entry level",
    "entry-level",
    "graduate",
    "graduates",
    "junior",
    "jr.",
    "trainee",
    "fresher",
    "freshers",
    "no experience required",
    "0-1 year",
    "0 - 1 year",
    "0 to 1 year",
    "1 year experience",
  ];

  if (
    entryLevelPatterns.some(
      (pattern) => text.includes(pattern)
    )
  ) {
    return "Entry Level";
  }

  /*
   * Senior-level signals
   */
  const seniorPatterns = [
    "senior",
    "sr.",
    "lead developer",
    "lead engineer",
    "principal",
    "staff engineer",
    "architect",
    "head of",
  ];

  if (
    seniorPatterns.some(
      (pattern) => text.includes(pattern)
    )
  ) {
    return "Senior Level";
  }

  /*
   * Mid-level signals
   */
  const midLevelPatterns = [
    "mid level",
    "mid-level",
    "middle level",
    "2-5 years",
    "3-5 years",
    "4-6 years",
    "2 to 5 years",
    "3 to 5 years",
  ];

  if (
    midLevelPatterns.some(
      (pattern) => text.includes(pattern)
    )
  ) {
    return "Mid Level";
  }

  return "";
};

// =========================================
// LOCAL FILTERING
// =========================================

const matchesLocalFilters = (
  job,
  { jobType, workMode }
) => {
  /*
   * Contract
   */
  if (jobType === "contract") {
    const contractType = (
      job.contract_type || ""
    ).toLowerCase();

    if (contractType !== "contract") {
      return false;
    }
  }

  /*
   * Internship
   */
  if (jobType === "internship") {
    if (!detectInternship(job)) {
      return false;
    }
  }

  /*
   * Work mode
   */
  if (workMode) {
    if (
      detectWorkMode(job) !== workMode
    ) {
      return false;
    }
  }

  return true;
};

// =========================================
// SALARY HELPERS
// =========================================

const getSalaryValue = (
  job,
  direction
) => {
  const salaryMin =
    Number(job.salary_min) || 0;

  const salaryMax =
    Number(job.salary_max) || 0;

  if (direction === "high") {
    return salaryMax || salaryMin;
  }

  return salaryMin || salaryMax;
};

// =========================================
// SEARCH ADZUNA
// =========================================

const searchAdzunaJobs = async ({
  query = "",
  location = "",
  jobType = "",
  workMode = "",
  sortBy = "relevance",
  page = 1,
  resultsPerPage = 20,
}) => {
  const requestedPage =
    Number(page) || 1;

  const requestedLimit =
    Number(resultsPerPage) || 20;

  /*
   * Some filters need Careerly-side filtering
   * because Adzuna does not expose them reliably.
   */
  const needsLocalFiltering =
    Boolean(workMode) ||
    jobType === "contract" ||
    jobType === "internship";

  /*
   * Fetch more results when we need to filter
   * locally so that enough matching jobs remain.
   */
  const adzunaPageSize =
    needsLocalFiltering
      ? 50
      : requestedLimit;

  const params = {
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    results_per_page: adzunaPageSize,
    what: query,
    where: location,
    "content-type": "application/json",
  };

  /*
   * Adzuna-native employment filters.
   */
  if (jobType === "full_time") {
    params.full_time = 1;
  }

  if (jobType === "part_time") {
    params.part_time = 1;
  }

  /*
   * Newest sorting can be handled directly
   * by Adzuna.
   */
  if (sortBy === "newest") {
    params.sort_by = "date";
  }

  const needsLocalSorting =
    sortBy === "salary_high" ||
    sortBy === "salary_low";

  /*
   * Fast path:
   * No local filtering or local salary sorting.
   */
  if (
    !needsLocalFiltering &&
    !needsLocalSorting
  ) {
    const response =
      await getAdzuna(
        `${ADZUNA_BASE_URL}/jobs/in/search/${requestedPage}`,
        { params }
      );

    const results =
      response.data.results || [];

    const totalResults =
      Number(response.data.count) || 0;

    return {
      ...response.data,
      results,
      count: results.length,
      total: totalResults,
      page: requestedPage,
      resultsPerPage: requestedLimit,
      hasMore:
        requestedPage *
          requestedLimit <
        totalResults,
    };
  }

  /*
   * Local filtering/sorting path.
   */
  const requiredMatches =
    requestedPage * requestedLimit;

  const allMatchingJobs = [];

  let rawPage = 1;
  let totalRawResults = 0;
  let hasMoreRawResults = true;

  const MAX_ADZUNA_PAGES = 20;

  while (
    hasMoreRawResults &&
    allMatchingJobs.length <
      requiredMatches &&
    rawPage <= MAX_ADZUNA_PAGES
  ) {
    const response =
      await getAdzuna(
        `${ADZUNA_BASE_URL}/jobs/in/search/${rawPage}`,
        {
          params: {
            ...params,
            results_per_page:
              adzunaPageSize,
          },
        }
      );

    const rawResults =
      response.data.results || [];

    totalRawResults =
      Number(response.data.count) ||
      totalRawResults;

    if (rawResults.length === 0) {
      hasMoreRawResults = false;
      break;
    }

    const matchingResults =
      rawResults.filter((job) =>
        matchesLocalFilters(job, {
          jobType,
          workMode,
        })
      );

    allMatchingJobs.push(
      ...matchingResults
    );

    hasMoreRawResults =
      rawPage * adzunaPageSize <
      totalRawResults;

    rawPage += 1;
  }

  /*
   * Remove duplicates.
   */
  const uniqueJobs = [];
  const seenIds = new Set();

  for (const job of allMatchingJobs) {
    const id = String(job.id);

    if (seenIds.has(id)) {
      continue;
    }

    seenIds.add(id);
    uniqueJobs.push(job);
  }

  /*
   * Salary sorting.
   */
  if (sortBy === "salary_high") {
    uniqueJobs.sort(
      (a, b) =>
        getSalaryValue(b, "high") -
        getSalaryValue(a, "high")
    );
  }

  if (sortBy === "salary_low") {
    uniqueJobs.sort(
      (a, b) =>
        getSalaryValue(a, "low") -
        getSalaryValue(b, "low")
    );
  }

  /*
   * Pagination after local filtering.
   */
  const startIndex =
    (requestedPage - 1) *
    requestedLimit;

  const endIndex =
    startIndex + requestedLimit;

  const paginatedResults =
    uniqueJobs.slice(
      startIndex,
      endIndex
    );

  const hasMore =
    uniqueJobs.length > endIndex ||
    hasMoreRawResults;

  return {
    results: paginatedResults,
    count: paginatedResults.length,
    total: uniqueJobs.length,
    rawTotal: totalRawResults,
    page: requestedPage,
    resultsPerPage: requestedLimit,
    hasMore,
  };
};

// =========================================
// NORMALIZE ADZUNA JOB
// =========================================

const normalizeAdzunaJob = (job) => {
  const isInternship =
    detectInternship(job);

  /*
   * Determine employment type.
   */
  let jobType =
    job.contract_type || "";

  if (isInternship) {
    jobType = "internship";
  } else if (jobType === "full_time") {
    jobType = "full_time";
  } else if (jobType === "part_time") {
    jobType = "part_time";
  } else if (
    jobType.toLowerCase() ===
    "contract"
  ) {
    jobType = "contract";
  }

  /*
   * Salary formatting.
   */
  const salary =
    job.salary_min ||
    job.salary_max
      ? `${job.salary_min || ""}${
          job.salary_min &&
          job.salary_max
            ? " - "
            : ""
        }${job.salary_max || ""}`
      : "";

  return {
    externalId: String(job.id),
    source: "adzuna",

    title: job.title || "",

    company:
      job.company?.display_name ||
      "",

    location:
      job.location?.display_name ||
      "",

    description:
      job.description || "",

    jobType,

    workMode:
      detectWorkMode(job),

    experienceLevel:
      detectExperienceLevel(job),

    skills: [],

    salary,

    applicationUrl:
      job.redirect_url || "",

    postedAt: job.created
      ? new Date(job.created)
      : null,

    rawData: job,
  };
};

module.exports = {
  searchAdzunaJobs,
  normalizeAdzunaJob,
};