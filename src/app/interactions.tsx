"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type KeyboardEvent } from "react";
import type { Contact, Order } from "@/sanity/lib/silventory";
import { updateOrderStatus } from "./actions";

const statuses: { value: Order["status"]; label: string }[] = [
  { value: "received", label: "Received" },
  { value: "inProgress", label: "In progress" },
  { value: "ready", label: "Ready for pickup" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function Header() {
  return <header className="topbar">
    <Link href="/" className="brand" aria-label="Silventory dashboard">
      <Image src="/silventory-icon.svg" alt="" width={36} height={36} className="brand-mark-image" />
      <span>silventory<span className="brand-dot">.</span></span>
    </Link>
    <Suspense fallback={<nav className="main-navigation" aria-label="Main navigation"><Link href="/">Dashboard</Link><Link href="/orders">Orders</Link><Link href="/contacts">Contacts</Link></nav>}>
      <ActiveNavigation />
    </Suspense>
    <Link className="button button-primary top-action" href="/orders/new"><span>＋</span> New order</Link>
  </header>;
}

function ActiveNavigation() {
  const pathname = usePathname();
  const ordersActive = pathname === "/orders" || pathname.startsWith("/orders/");
  const dashboardActive = pathname === "/";
  const contactsActive = pathname === "/contacts" || pathname.startsWith("/contacts/");
  return <nav className="main-navigation" aria-label="Main navigation">
      <Link href="/" aria-current={dashboardActive ? "page" : undefined}>Dashboard</Link>
      <Link href="/orders" aria-current={ordersActive ? "page" : undefined}>Orders</Link>
      <Link href="/contacts" aria-current={contactsActive ? "page" : undefined}>Contacts</Link>
  </nav>;
}

export function OrderStatusSelector({ orderId, currentStatus, label }: { orderId: string; currentStatus: Order["status"]; label: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [pending, startTransition] = useTransition();
  function save(event: ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.currentTarget.value as Order["status"];
    setStatus(nextStatus);
    const data = new FormData();
    data.set("orderId", orderId);
    data.set("status", nextStatus);
    startTransition(() => updateOrderStatus(data));
  }
  return <select className="status-select" aria-label={label} value={status} onChange={save} disabled={pending}>
    {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
  </select>;
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

export function ClothPhotoPicker({ required = true, currentPhotoName }: { required?: boolean; currentPhotoName?: string }) {
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  function openPicker(useCamera: boolean) {
    const input = inputRef.current;
    if (!input) return;
    if (useCamera) input.setAttribute("capture", "environment");
    else input.removeAttribute("capture");
    input.click();
  }
  return <div className="photo-picker">
    <input
      ref={(element) => { inputRef.current = element; }}
      className="photo-file-input"
      aria-label="Cloth photo file"
      name="clothPhoto"
      type="file"
      accept="image/*"
      required={required}
      onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
    />
    <div className="photo-picker-preview"><span className="photo-upload-icon">▧</span><span><strong>{fileName || currentPhotoName || "No photo selected"}</strong><small>JPG, PNG or HEIC · clear, well-lit photos work best</small></span></div>
    <div className="photo-picker-actions"><button type="button" className="button button-outline" onClick={() => openPicker(true)}>Take photo</button><button type="button" className="button button-outline" onClick={() => openPicker(false)}>Choose from device</button></div>
  </div>;
}
