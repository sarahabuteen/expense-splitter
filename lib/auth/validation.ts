/**
 * Shared validation for the auth forms and the routes behind them.
 *
 * The client copy is feedback, not a control: every rule here runs again
 * server-side, because anything enforced only in the browser is not enforced.
 */

export type FieldErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return "Enter your email address.";
  }
  if (!EMAIL.test(value.trim())) {
    return "That doesn't look like an email address.";
  }
  return null;
}

export function validatePassword(value: unknown, isNew = false): string | null {
  if (typeof value !== "string" || value === "") {
    return "Enter your password.";
  }
  if (isNew && value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validateName(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return "Enter your name.";
  }
  if (value.trim().length > 80) {
    return "That name is too long.";
  }
  return null;
}

export function collect(entries: Record<string, string | null>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field, error] of Object.entries(entries)) {
    if (error) errors[field] = error;
  }
  return errors;
}

/**
 * Supabase's messages are written for developers ("Invalid login credentials",
 * "User already registered"). Translate them, and never pass an unrecognised
 * one through to the user — an unexpected internal message is worse than a
 * plain one.
 */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "That email and password don't match an account.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with that email already exists. Try signing in.";
  }
  if (m.includes("email not confirmed")) {
    return "Check your inbox and confirm your email before signing in.";
  }
  if (m.includes("password should be at least")) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "That email address was rejected. Try a different one.";
  }
  if (m.includes("same password")) {
    return "Choose a password different from your current one.";
  }
  return "Something went wrong. Please try again.";
}
