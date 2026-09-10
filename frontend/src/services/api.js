import axios from "axios";
import { auth } from "../config/firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ==================== AUTH TOKEN CACHE ====================

let cachedToken = null;
let tokenPromise = null;

const getAuthToken = async () => {
  const user = auth.currentUser;

  if (!user) {
    cachedToken = null;
    return null;
  }

  /*
   * Reuse the token when possible.
   * Firebase handles token expiration internally.
   */
  if (cachedToken) {
    return cachedToken;
  }

  /*
   * Prevent multiple simultaneous requests
   * from requesting the token independently.
   */
  if (!tokenPromise) {
    tokenPromise = user
      .getIdToken(false)
      .then((token) => {
        cachedToken = token;
        return token;
      })
      .finally(() => {
        tokenPromise = null;
      });
  }

  return tokenPromise;
};

// Clear cached token whenever Firebase auth state changes.
auth.onAuthStateChanged(() => {
  cachedToken = null;
  tokenPromise = null;
});

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== USERS ====================

export const syncUser = async () => {
  const response = await api.post("/users/sync");

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");

  return response.data;
};

export const updateCurrentUser = async (
  userData
) => {
  const response = await api.put(
    "/users/me",
    userData
  );

  return response.data;
};

export const updateTheme = async (theme) => {
  const response = await api.put(
    "/users/me",
    {
      preferences: {
        theme,
      },
    }
  );

  return response.data;
};

// ==================== JOBS ====================

export const getJobs = async (params = {}) => {
  const response = await api.get("/jobs", {
    params,
  });

  return response.data;
};

export const getJobById = async (id) => {
  const response = await api.get(`/jobs/${id}`);

  return response.data;
};

export const getExternalJobs = async ({
  search = "",
  location = "",
  jobType = "",
  workMode = "",
  sortBy = "relevance",
  page = 1,
  limit = 20,
}) => {
  const response = await api.get(
    "/jobs/external/search",
    {
      params: {
        search,
        location,
        jobType,
        workMode,
        sortBy,
        page,
        limit,
      },
    }
  );

  return response.data;
};

export const getExternalJobById = async (
  source,
  externalId
) => {
  const response = await api.get(
    `/jobs/external/${source}/${externalId}`
  );

  return response.data;
};

// ==================== SAVED JOBS ====================

export const saveJob = async (job) => {
  const response = await api.post(
    "/saved-jobs",
    job
  );

  return response.data;
};

export const getSavedJobs = async () => {
  const response = await api.get("/saved-jobs");

  return response.data;
};

export const getSavedJobByExternalId = async (
  source,
  externalId
) => {
  const response = await api.get(
    `/saved-jobs/external/${source}/${externalId}`
  );

  return response.data;
};

export const deleteSavedJob = async (id) => {
  const response = await api.delete(
    `/saved-jobs/${id}`
  );

  return response.data;
};

export const checkSavedJob = async (
  source,
  externalId
) => {
  const response = await api.get(
    `/saved-jobs/check/${source}/${externalId}`
  );

  return response.data;
};

// ==================== APPLICATIONS ====================

export const createApplication = async (
  applicationData
) => {
  const response = await api.post(
    "/applications",
    applicationData
  );

  return response.data;
};

export const getApplications = async () => {
  const response = await api.get(
    "/applications"
  );

  return response.data;
};

export const checkApplication = async (
  source,
  externalId
) => {
  const response = await api.get(
    `/applications/check/${source}/${externalId}`
  );

  return response.data;
};

export const updateApplication = async (
  id,
  applicationData
) => {
  const response = await api.put(
    `/applications/${id}`,
    applicationData
  );

  return response.data;
};

export const deleteApplication = async (id) => {
  const response = await api.delete(
    `/applications/${id}`
  );

  return response.data;
};

// ==================== RESUMES ====================

export const getResumes = async () => {
  const response = await api.get("/resume");

  return response.data;
};

export const createResume = async (resumeData) => {
  const response = await api.post(
    "/resume",
    resumeData
  );

  return response.data;
};

export const updateResume = async (
  id,
  resumeData
) => {
  const response = await api.put(
    `/resume/${id}`,
    resumeData
  );

  return response.data;
};

export const deleteResume = async (id) => {
  const response = await api.delete(
    `/resume/${id}`
  );

  return response.data;
};

export const uploadResume = async (
  file,
  name = ""
) => {
  const formData = new FormData();

  formData.append("resume", file);

  if (name.trim()) {
    formData.append(
      "name",
      name.trim()
    );
  }

  const response = await api.post(
    "/resume/upload",
    formData
  );

  return response.data;
};

// ==================== AI ====================

export const matchJobWithAI = async (
  resume,
  job
) => {
  const response = await api.post(
    "/ai/match-job",
    {
      resume,
      job,
    }
  );

  return response.data;
};

export const tailorResumeWithAI = async (job) => {
  const response = await api.post("/ai/tailor-resume", {
    job,
  });

  return response.data;
};

export const getRecommendedJobs = async () => {
  console.log(
    "Calling /ai/recommendations..."
  );

  const response = await api.get(
    "/ai/recommendations"
  );

  console.log(
    "Received /ai/recommendations response:",
    response
  );

  return response.data;
};

export const saveRecommendationFeedback = async (
  feedbackData
) => {
  const response = await api.post(
    "/recommendation-feedback",
    feedbackData
  );

  return response.data;
};

export const saveTailoredResume = async (
  jobTitle,
  company,
  tailoredResume
) => {
  const response = await api.post(
    "/resume/save-tailored",
    {
      jobTitle,
      company,
      tailoredResume,
    }
  );

  return response.data;
};

export default api;