export type AssetType = 1 | 2 | 3 | 4;

export type AssetPurpose = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type AssetVisibility = 1 | 2;

export type CreateAssetUploadRequest = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  type: AssetType;
  purpose: AssetPurpose;
  visibility: AssetVisibility;
  programId?: string;
  lessonId?: string;
};

export type CompleteAssetUploadRequest = {
  checksum?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type AssetResponse = {
  id: string;
  ownerUserId?: string;
  programId?: string;
  lessonId?: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  type: string;
  purpose: string;
  visibility: string;
  status: string;
  storageProvider: string;
  storageKey: string;
  publicUrl?: string;
  deliveryUrl?: string;
  checksum?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  createdAt: string;
  uploadedAt?: string;
};

export type AssetUploadUrlResponse = {
  assetId: string;
  uploadUrl: string;
  httpMethod: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
  asset: AssetResponse;
};

export type AssetAccessResponse = {
  assetId: string;
  url: string;
  contentType: string;
  fileName: string;
  isSigned: boolean;
  expiresAt?: string;
};

export const assetTypes = {
  image: 1,
  video: 2,
  document: 3,
  other: 4
} as const;

export const assetPurposes = {
  general: 1,
  programThumbnail: 2,
  lessonVideo: 3,
  lessonResource: 4,
  assignmentSubmission: 5,
  projectSubmission: 6,
  supportAttachment: 7,
  userProfile: 8
} as const;

export const assetVisibilities = {
  public: 1,
  private: 2
} as const;
