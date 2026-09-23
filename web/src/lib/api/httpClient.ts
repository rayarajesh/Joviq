import { env } from "../../config/env";
import type { ApiResponse, ProblemDetails, RequestOptions } from "./types";

export class ApiError extends Error {
  status: number;
  problem?: ProblemDetails;

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

let accessToken: string | null = null;
let unauthorizedHandler: (() => Promise<string | null>) | null = null;
const clientDeviceStorageKey = "joviq-device-id";

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  }
};

export function setUnauthorizedHandler(handler: (() => Promise<string | null>) | null) {
  unauthorizedHandler = handler;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  return send<T>(path, options, false);
}

async function send<T>(path: string, options: RequestOptions, hasRetried: boolean): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const clientDeviceId = getClientDeviceId();
  if (clientDeviceId) {
    headers.set("X-Device-Id", clientDeviceId);
  }

  const formDataBody = typeof FormData !== "undefined" && options.body instanceof FormData ? options.body : null;
  const isFormData = formDataBody !== null;

  if (options.body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const requestBody: BodyInit | undefined =
    options.body === undefined ? undefined : formDataBody ?? JSON.stringify(options.body);

  const token = options.accessToken ?? tokenStore.get();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Debug logging for login requests
  if (path.includes("/auth/login")) {
    const bodyObj = options.body as any;
    console.log("[httpClient] Sending login request to:", `${env.apiBaseUrl}${path}`);
    console.log("[httpClient] Email:", bodyObj?.email);
    console.log("[httpClient] Password:", bodyObj?.password);
    console.log("[httpClient] Password length:", bodyObj?.password?.length ?? 0);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: requestBody
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") || contentType.includes("application/problem+json")
    ? await response.json() : null;

  if (!response.ok) {
    if (
      response.status === 401 &&
      !hasRetried &&
      !options.skipAuthRetry &&
      options.accessToken !== null &&
      token &&
      unauthorizedHandler
    ) {
      const refreshedToken = await unauthorizedHandler();
      if (refreshedToken) {
        return send<T>(path, { ...options, accessToken: refreshedToken }, true);
      }
    }

    const problem = payload as ProblemDetails | null;
    const message = problem?.title ?? `Request failed with ${response.status}`;
    
    // Debug logging for login errors
    if (path.includes("/auth/login")) {
      console.error("[httpClient] Login failed with status:", response.status);
      console.error("[httpClient] Response body:", payload);
    }
    
    throw new ApiError(message, response.status, problem ?? undefined);
  }

  return payload as ApiResponse<T>;
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldErrors = error.problem?.errors
      ? Object.entries(error.problem.errors)
          .flatMap(([field, messages]) => messages.map((message) => `${formatFieldName(field)}: ${message}`))
          .join("\n")
      : "";

    const detail = error.problem?.detail ? `\n${error.problem.detail}` : "";
    const suffix = fieldErrors || detail ? `\n${fieldErrors || detail.trim()}` : "";
    return `${error.message} (${error.status})${suffix}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function formatFieldName(field: string) {
  if (field === "$" || field.toLowerCase() === "request") {
    return "Request";
  }

  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (value) => value.toUpperCase());
}

export function getClientDeviceId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existing = window.localStorage.getItem(clientDeviceStorageKey);
    if (existing) {
      return existing;
    }

    const created = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(clientDeviceStorageKey, created);
    return created;
  } catch {
    return null;
  }
}
