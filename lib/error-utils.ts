type ErrorLike = {
  code?: string;
  message?: string;
};

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === "object" && value !== null;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (isErrorLike(error) && typeof error.message === "string" && error.message) {
    return error.message;
  }

  return fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  if (isErrorLike(error) && typeof error.code === "string") {
    return error.code;
  }

  return undefined;
}
