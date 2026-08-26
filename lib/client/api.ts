"use client";

/**
 * Thin fetch wrapper for the group endpoints.
 *
 * Every route answers with `{ error }` on failure, so one shape covers all of
 * them. A 401 carries `requiresAuth`, which is how a guest attempting a write
 * gets told to sign up rather than shown a bare failure.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requiresAuth = false,
  ) {
    super(message);
  }
}

async function send<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection.", 0);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      body.error ?? "Something went wrong.",
      response.status,
      Boolean(body.requiresAuth),
    );
  }
  return body as T;
}

export type ExpenseBody = {
  description: string;
  amountMinor: number;
  currency: string;
  date: string;
  category: string;
  paidBy: string;
  splitType: "equal" | "exact" | "percentage" | "shares";
  participants: string[];
  values?: Record<string, number>;
  exchangeRate?: number;
};

export const groupsApi = {
  create: (input: {
    name: string;
    description?: string;
    currency: string;
    memberNames?: string[];
  }) => send<{ id: string }>("/api/groups", { method: "POST", body: JSON.stringify(input) }),

  update: (groupId: string, input: { name?: string; description?: string; currency?: string }) =>
    send<{ id: string }>(`/api/groups/${groupId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (groupId: string) =>
    send<{ id: string }>(`/api/groups/${groupId}`, { method: "DELETE" }),

  addMember: (groupId: string, input: { name: string; email?: string }) =>
    send<{ id: string }>(`/api/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  createExpense: (groupId: string, input: ExpenseBody) =>
    send<{ id: string }>(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateExpense: (groupId: string, expenseId: string, input: ExpenseBody) =>
    send<{ id: string }>(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteExpense: (groupId: string, expenseId: string) =>
    send<{ id: string }>(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: "DELETE",
    }),

  removeMember: (groupId: string, memberId: string) =>
    send<{ id: string }>(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" }),
};
