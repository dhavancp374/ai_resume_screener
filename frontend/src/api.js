import axios from "axios";

const API_BASE = "http://localhost:5000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minute timeout for processing
});

// Add request interceptor for error handling
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error("Response error:", error.response || error.message);
    const message = error.response?.data?.error || error.message || "Network error";
    return Promise.reject(new Error(message));
  }
);

/**
 * Rank resumes against a job description
 * @param {string} jobDescription - The job description text
 * @param {File[]} files - Array of PDF resume files
 * @returns {Promise<Object>} Results with rankings and summary
 */
export const rankResumes = async (jobDescription, files) => {
  const formData = new FormData();

  // Add job description (Flask expects this exact field name)
  formData.append("job_description", jobDescription);

  // Add resume files
  files.forEach((file) => {
    formData.append("resumes", file);
  });

  try {
    const response = await apiClient.post("/rank", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Return the results array or the full response
    return response.data.results || response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Check API health
 * @returns {Promise<Object>} Health status
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get("/health");
    return response.data;
  } catch (error) {
    throw new Error("Backend service unavailable");
  }
};

/**
 * Get service statistics
 * @returns {Promise<Object>} Service stats
 */
export const getStats = async () => {
  try {
    const response = await apiClient.get("/stats");
    return response.data;
  } catch (error) {
    console.warn("Could not fetch stats:", error);
    return null;
  }
};

/**
 * Clear the backend cache
 * @returns {Promise<Object>} Clear operation status
 */
export const clearCache = async () => {
  try {
    const response = await apiClient.post("/clear-cache");
    return response.data;
  } catch (error) {
    throw error;
  }
};
