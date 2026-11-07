"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function OrderSubmitForm({
  action,
  destination,
  className,
  hint,
  submitLabel,
  children,
}: {
  action: string;
  destination: string;
  className: string;
  hint: ReactNode;
  submitLabel: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError("");

    try {
      const response = await fetch(action, { method: "POST", body: formData });
      if (!response.ok) {
        throw new Error(`Saving failed (HTTP ${response.status}). Please try again.`);
      }

      router.push(destination);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.startsWith("Saving failed")
          ? cause.message
          : "Could not save the order. Check your connection and try again.",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className={className}>
      {children}
      <div className="form-actions">
        <p>{hint}</p>
        <button className="button button-primary submit-order" type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel} <span>→</span>
        </button>
      </div>
      {error && <p className="form-submit-error" role="alert">{error}</p>}
    </form>
  );
}
