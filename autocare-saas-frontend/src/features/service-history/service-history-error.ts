import axios from "axios";

export function serviceHistoryErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const value = error.response?.data.message;
    return Array.isArray(value)
      ? value.join(". ")
      : (value ?? "The request could not be completed.");
  }
  return "The request could not be completed.";
}
