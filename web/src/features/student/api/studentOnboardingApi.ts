import { request } from "../../../lib/api/httpClient";
import type {
  StudentOnboardingResponse,
  UpdateAcademicDetailsRequest,
  UpdateCareerDetailsRequest,
  UpdatePersonalDetailsRequest
} from "./studentOnboardingTypes";

export const studentOnboardingApi = {
  get() {
    return request<StudentOnboardingResponse>("/api/v1/student/onboarding");
  },

  updatePersonal(body: UpdatePersonalDetailsRequest) {
    return request<StudentOnboardingResponse>("/api/v1/student/onboarding/personal", {
      method: "PUT",
      body
    });
  },

  updateAcademic(body: UpdateAcademicDetailsRequest) {
    return request<StudentOnboardingResponse>("/api/v1/student/onboarding/academic", {
      method: "PUT",
      body
    });
  },

  updateCareer(body: UpdateCareerDetailsRequest) {
    return request<StudentOnboardingResponse>("/api/v1/student/onboarding/career", {
      method: "PUT",
      body
    });
  },

  uploadResume(file: File) {
    const body = new FormData();
    body.append("resume", file);

    return request<StudentOnboardingResponse>("/api/v1/student/onboarding/resume", {
      method: "POST",
      body
    });
  },

  deleteResume() {
    return request<StudentOnboardingResponse>("/api/v1/student/onboarding/resume", {
      method: "DELETE"
    });
  },

  complete() {
    return request<StudentOnboardingResponse>("/api/v1/student/onboarding/complete", {
      method: "POST"
    });
  }
};
