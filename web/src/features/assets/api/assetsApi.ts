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

    const response = await fetch(toBrowserApiUrl(upload.data.uploadUrl), {
      method: upload.data.httpMethod,
      headers: upload.data.headers,
      body: file
    });

    if (!response.ok) {
      throw new Error(`Upload failed with ${response.status}.`);
    }

    return assetsApi.completeUpload(upload.data.assetId);
  }
};

function toBrowserApiUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "localhost" && url.port === "7001") {
      url.hostname = "127.0.0.1";
      url.protocol = "http:";
      url.port = "5001";
    }
    return url.toString();
  } catch {
    return value;
  }
}
