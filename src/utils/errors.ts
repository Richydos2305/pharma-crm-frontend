import { isAxiosError } from 'axios';

export function getApiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const msg: string | undefined = err.response?.data?.error?.message ?? err.response?.data?.message;
    if (msg) return formatApiErrorMessage(msg);
  }
  return 'Something went wrong. Please try again.';
}

// Converts raw byte counts (6+ digits) to MB
// e.g. "Got 19243481. Max is 10485760." → "Got 18.4 MB. Max is 10.0 MB."
function formatApiErrorMessage(msg: string): string {
  return msg.replace(/\b(\d{6,})\b/g, (m) => `${(parseInt(m, 10) / 1048576).toFixed(1)} MB`);
}
