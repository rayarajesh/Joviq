import { request } from "../../../lib/api/httpClient";
import type {
  AssetAccessResponse,
  AssetResponse,
  AssetUploadUrlResponse,
  CompleteAssetUploadRequest,
  CreateAssetUploadRequest
} from "./assetsTypes";

export const assetsApi = {
  createUploadUrl(body: CreateAssetUploadRequest) {
    return request<AssetUploadUrlResponse>("/api/v1/assets/upload-url", { method: "POST", body });
  },

  completeUpload(assetId: string, body: CompleteAssetUploadRequest = {}) {
    return request<AssetResponse>(`/api/v1/assets/${assetId}/complete`, { method: "POST", body });
  },

  getAsset(assetId: string) {
    return request<AssetResponse>(`/api/v1/assets/${assetId}`);
  },

  getAccessUrl(assetId: string) {
    return request<AssetAccessResponse>(`/api/v1/assets/${assetId}/access`);
  },

  async uploadFile(file: File, body: Omit<CreateAssetUploadRequest, "fileName" | "contentType" | "sizeBytes">) {
    const upload = await assetsApi.createUploadUrl({
      ...body,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size
    });

    await fetch(upload.data.uploadUrl, {
      method: upload.data.httpMethod,
      headers: upload.data.headers,
      body: file
    });

    return assetsApi.completeUpload(upload.data.assetId);
  }
};
