"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { Suspense } from "react";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type KeyboardEvent } from "react";
import type { Contact, Order } from "@/sanity/lib/silventory";
type EditableOrderStatus = Exclude<Order["status"], "ready">;

const statuses: { value: EditableOrderStatus; label: string }[] = [
  { value: "received", label: "Received" },
  { value: "inProgress", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function Header() {
  return <header className="topbar">
    <Link href="/" prefetch={true} className="brand" aria-label="Silventory dashboard">
      <Image src="/silventory-icon.svg" alt="" width={36} height={36} className="brand-mark-image" />
      <span>silventory<span className="brand-dot">.</span></span>
    </Link>
    <Suspense fallback={<nav className="main-navigation" aria-label="Main navigation"><Link href="/" prefetch={true}>Dashboard</Link><Link href="/orders" prefetch={true}>Orders</Link><Link href="/contacts" prefetch={true}>Contacts</Link></nav>}>
      <ActiveNavigation />
    </Suspense>
    <Link className="button button-primary top-action" href="/orders/new" prefetch={true}><span>＋</span> New order</Link>
  </header>;
}

function ActiveNavigation() {
  const pathname = usePathname();
  const ordersActive = pathname === "/orders" || pathname.startsWith("/orders/");
  const dashboardActive = pathname === "/";
  const contactsActive = pathname === "/contacts" || pathname.startsWith("/contacts/");
  return <nav className="main-navigation" aria-label="Main navigation">
      <Link href="/" prefetch={true} aria-current={dashboardActive ? "page" : undefined}>Dashboard</Link>
      <Link href="/orders" prefetch={true} aria-current={ordersActive ? "page" : undefined}>Orders</Link>
      <Link href="/contacts" prefetch={true} aria-current={contactsActive ? "page" : undefined}>Contacts</Link>
  </nav>;
}

export function OrderStatusSelector({ orderId, currentStatus, label }: { orderId: string; currentStatus: Order["status"]; label: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<EditableOrderStatus | "">(currentStatus === "ready" ? "" : currentStatus);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save(event: ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.currentTarget.value as EditableOrderStatus;
    const previousStatus = status;
    setStatus(nextStatus);
    setError("");
    const data = new FormData();
    data.set("orderId", orderId);
    data.set("status", nextStatus);
    startTransition(async () => {
      let lastError: Error | undefined;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch("/api/orders/status", { method: "POST", body: data });
          if (!response.ok) throw new Error(`Order status update failed with status ${response.status}.`);
          router.refresh();
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 300 * (attempt + 1)));
        }
      }
      if (lastError) {
        console.error("Could not save order status after retrying.", lastError);
      }
      setStatus(previousStatus);
      setError("Could not save status. Please try again.");
    });
  }
  return <>
    <select
      className="status-select"
      aria-label={label}
      aria-invalid={Boolean(error)}
      title={error || label}
      value={status}
      onChange={save}
      disabled={pending}
    >
      {currentStatus === "ready" && <option value="" disabled>Choose a status</option>}
      {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
    {error && <span className="sr-only" role="alert">{error}</span>}
  </>;
}

export function ContactPicker({ contacts, name = "contactId", initialContactId = "", required = true, disabled = false, id = "contactId" }: {
  contacts: Contact[];
  name?: string;
  initialContactId?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  const initial = contacts.find((contact) => contact._id === initialContactId);
  const [contactId, setContactId] = useState(initial?._id || "");
  const [query, setQuery] = useState(initial?.name || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchRef.current?.setCustomValidity(required && !contactId && query ? "Choose a customer from the search results." : "");
  }, [contactId, query, required]);
  const matches = contacts.filter((contact) => {
    const search = query.trim().toLowerCase();
    return !search || `${contact.name} ${contact.phone || ""} ${contact.email || ""}`.toLowerCase().includes(search);
  }).slice(0, 8);

  function select(contact: Contact) {
    setContactId(contact._id);
    setQuery(contact.name);
    setOpen(false);
  }

  function changeQuery(event: ChangeEvent<HTMLInputElement>) {
    setContactId("");
    setQuery(event.target.value);
    setActiveIndex(0);
    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(0, matches.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" && open && matches[activeIndex]) {
      event.preventDefault();
      select(matches[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return <div className="contact-picker">
    <input type="hidden" name={name} value={contactId} disabled={disabled} />
    <div className="contact-picker-control">
      <span className="contact-search-icon" aria-hidden="true">⌕</span>
      <input
        ref={searchRef}
        id={id}
        type="search"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={!disabled && open}
        aria-controls={`${id}-options`}
        aria-activedescendant={open && matches[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        aria-label="Search contacts by name, phone, or email"
        placeholder={contacts.length ? "Type a name, phone, or email…" : "No contacts yet — create one below"}
        value={query}
        disabled={disabled}
        required={required && !contactId && !disabled}
        onChange={changeQuery}
        onFocus={() => !disabled && setOpen(true)}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) setOpen(false);
        }}
      />
      {contactId && !disabled && <button type="button" className="contact-picker-clear" aria-label="Clear selected contact" onClick={() => { setContactId(""); setQuery(""); setOpen(true); }}>×</button>}
      {open && !disabled && <div className="contact-picker-options" role="listbox" id={`${id}-options`}>
        {matches.length ? matches.map((contact, index) => <button
          type="button"
          role="option"
          aria-selected={contact._id === contactId}
          id={`${id}-option-${index}`}
          className={`contact-picker-option ${index === activeIndex ? "highlighted" : ""}`}
          key={contact._id}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => select(contact)}
        ><span className="contact-avatar">{contact.name.slice(0, 1).toUpperCase()}</span><span><strong>{contact.name}</strong><small>{contact.phone || contact.email || "No contact details"}</small></span></button>) : <p className="contact-picker-empty">No matching contacts. Try a different search.</p>}
      </div>}
    </div>
  </div>;
}

export function ClothPhotoPicker({ currentPhotoName }: { currentPhotoName?: string }) {
  const [fileName, setFileName] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const webcamRef = useRef<Webcam>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function chooseFromDevice() {
    fileInputRef.current?.click();
  }

  async function capturePhoto() {
    const image = webcamRef.current?.getScreenshot();
    if (!image) {
      setCameraError("The camera is not ready yet. Please wait a moment and try again.");
      return;
    }

    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], `cloth-photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      if (cameraInputRef.current) cameraInputRef.current.files = transfer.files;
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFileName(file.name);
      setCameraOpen(false);
      setCameraError("");
    } catch (error) {
      console.error("Could not prepare the captured cloth photo.", error);
      setCameraError("Could not use that photo. Please try again or choose a photo from your device.");
    }
  }

  return <div className="photo-picker">
    <input
      ref={cameraInputRef}
      className="photo-file-input"
      tabIndex={-1}
      aria-hidden="true"
      name="cameraPhoto"
      type="file"
      accept="image/jpeg"
    />
    <input
      ref={fileInputRef}
      className="photo-file-input"
      aria-label="Choose cloth photo from device"
      name="clothPhoto"
      type="file"
      accept="image/*"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) {
          if (cameraInputRef.current) cameraInputRef.current.value = "";
          setFileName(file.name);
        }
      }}
    />
    <div className="photo-picker-preview"><span className="photo-upload-icon">▧</span><span><strong>{fileName || currentPhotoName || "No photo selected"}</strong><small>JPG, PNG or HEIC (converted to JPG on upload) · clear, well-lit photos work best</small></span></div>
    <div className="photo-picker-actions">
      <button type="button" className="button button-outline" onClick={() => { setCameraError(""); setCameraOpen((open) => !open); }}>
        {cameraOpen ? "Close camera" : "Take photo"}
      </button>
      <button type="button" className="button button-outline" onClick={chooseFromDevice}>Choose from device</button>
    </div>
    {cameraOpen && <div className="photo-camera">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.9}
        videoConstraints={{
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }}
        playsInline
        muted
        autoPlay
        onUserMediaError={(error) => {
          console.error("Could not access the device camera.", error);
          setCameraError("Could not access the camera. Allow camera access in your browser settings, or choose a photo from your device.");
        }}
      />
      {cameraError && <p className="photo-camera-error" role="alert">{cameraError}</p>}
      <button type="button" className="button button-primary" onClick={capturePhoto} disabled={Boolean(cameraError)}>
        Capture photo
      </button>
    </div>}
  </div>;
}
