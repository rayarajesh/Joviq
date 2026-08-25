export type StudentOnboardingResponse = {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  onboardingStatus: string;
  personal: PersonalDetails;
  academic: AcademicDetails;
  career: CareerDetails;
  resume: ResumeDetails;
  completionPercentage: number;
  missingFields: string[];
};

export type PersonalDetails = {
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
};

export type AcademicDetails = {
  college?: string;
  degree?: string;
  branch?: string;
  graduationYear?: number;
  cgpaOrPercentage?: string;
};

export type CareerDetails = {
  targetJobRole?: string;
  skills: string[];
  linkedInUrl?: string;
  gitHubUrl?: string;
  portfolioUrl?: string;
};

export type ResumeDetails = {
  resumeUrl?: string;
  resumeFileName?: string;
  resumeContentType?: string;
  resumeSizeBytes?: number;
  resumeUploadedAt?: string;
};

export type UpdatePersonalDetailsRequest = {
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
};

export type UpdateAcademicDetailsRequest = {
  college: string;
  degree: string;
  branch: string;
  graduationYear: number;
  cgpaOrPercentage: string;
};

export type UpdateCareerDetailsRequest = {
  targetJobRole: string;
  skills: string[];
  linkedInUrl: string;
  gitHubUrl: string;
  portfolioUrl: string;
};
