export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  correlationId?: string;
};

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
};

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  accessToken?: string | null;
  skipAuthRetry?: boolean;
};
