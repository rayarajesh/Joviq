export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "https://localhost:7001",
  // The learner dashboard lives in the full LMS web app.
  lmsAppUrl: import.meta.env.VITE_LMS_APP_URL?.replace(/\/$/, "") ?? ""
};
