"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Inline "add someone" row.
 *
 * Enter submits from either field, so adding four people is four rounds of
 * type-tab-type-enter without ever reaching for the mouse.
 */
export function AddMemberRow({
  existingNames,
  onAdd,
}: {
  existingNames: readonly string[];
  onAdd: (member: { name: string; email: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name to add someone.");
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError(`${trimmed} is already in this group.`);
      return;
    }
    onAdd({ name: trimmed, email: email.trim() });
    setName("");
    setEmail("");
    setError(null);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      // Inside a <form> this would submit the whole thing.
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="rounded-md border border-dashed border-border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-10 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text-primary transition-colors focus:border-accent"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium">
            Email
            <span className="ms-1.5 font-normal text-text-secondary">optional</span>
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            inputMode="email"
            aria-describedby="add-member-email-hint"
            className="h-10 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text-primary transition-colors focus:border-accent"
          />
        </label>
        <Button type="button" onClick={submit} className="h-10">
          Add
        </Button>
      </div>
      {/* Core #1: "by name (and optionally email for registered users)" — the
          email is what ties a member to an account, so it is only meaningful
          for someone who has one. */}
      <p id="add-member-email-hint" className="mt-2 text-xs text-text-secondary">
        A name is all you need. Add an email only for someone with an account.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-owe">
          {error}
        </p>
      ) : null}
    </div>
  );
}
