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

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  }
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

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

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: requestBody
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const problem = payload as ProblemDetails | null;
    const message = problem?.title ?? `Request failed with ${response.status}`;
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
