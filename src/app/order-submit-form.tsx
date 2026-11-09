"use client";

import { useState, type FormEvent, type ReactNode } from "react";

class HeicConversionError extends Error {
  constructor() {
    super("Could not convert this HEIC photo. Please choose a JPG or PNG instead.");
    this.name = "HeicConversionError";
  }
}

async function convertHeicPhotos(formData: FormData) {
  for (const field of ["cameraPhoto", "clothPhoto"]) {
    const file = formData.get(field);
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      (!/^image\/hei[cf](?:$|[-;+])/i.test(file.type) &&
        !/\.(?:heic|heif|heics|heifs)$/i.test(file.name))
    ) {
      continue;
    }

    let converted: Blob | Blob[];
    try {
      const { default: heic2any } = await import("heic2any");
      converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    } catch (cause) {
      console.error("Could not convert selected HEIC cloth photo.", cause);
      throw new HeicConversionError();
    }

    const jpeg = Array.isArray(converted) ? converted[0] : converted;
    if (!jpeg) throw new HeicConversionError();

    const jpegName = file.name.replace(/\.(?:heic|heif|heics|heifs)$/i, ".jpg");
    formData.set(
      field,
      new File([jpeg], jpegName === file.name ? `${file.name}.jpg` : jpegName, {
        type: "image/jpeg",
        lastModified: file.lastModified,
      }),
    );
  }
}

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError("");

    try {
      await convertHeicPhotos(formData);
      const response = await fetch(action, { method: "POST", body: formData });
      if (!response.ok) {
        throw new Error(`Saving failed (HTTP ${response.status}). Please try again.`);
      }

      window.location.assign(destination);
    } catch (cause) {
      setError(
        cause instanceof HeicConversionError
          ? cause.message
          : cause instanceof Error && cause.message.startsWith("Saving failed")
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
