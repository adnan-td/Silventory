"use client";

import { useState, useTransition } from "react";
import { importContacts, type ImportedContact } from "../actions";

function unescapeVcard(value: string) {
  return value.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();
}

function parseVcf(text: string): ImportedContact[] {
  const cards = text.split(/BEGIN:VCARD/i).slice(1);
  return cards.map((card) => {
    const lines = card.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
    const get = (key: string) => lines.find((line) => line.toUpperCase().startsWith(`${key};`) || line.toUpperCase().startsWith(`${key}:`))?.split(":").slice(1).join(":");
    const rawName = get("FN");
    const structuredName = get("N")?.split(";").filter(Boolean).reverse().join(" ");
    return { name: unescapeVcard(rawName || structuredName || ""), phone: unescapeVcard(get("TEL") || ""), email: unescapeVcard(get("EMAIL") || "") };
  }).filter((contact) => contact.name);
}

function parseCsv(text: string): ImportedContact[] {
  const rows = text.trim().split(/\r?\n/).map((line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((value) => value.trim().replace(/^"|"$/g, "")));
  if (!rows.length) return [];
  const first = rows[0].map((cell) => cell.toLowerCase());
  const hasHeader = first.some((cell) => ["name", "full name", "phone", "email"].includes(cell));
  const headers = hasHeader ? first : ["name", "phone", "email"];
  return rows.slice(hasHeader ? 1 : 0).map((row) => {
    const value = (key: string) => row[headers.findIndex((header) => header.includes(key))] || "";
    return { name: value("name"), phone: value("phone"), email: value("email") };
  }).filter((contact) => contact.name);
}

export function ContactImporter() {
  const [contacts, setContacts] = useState<ImportedContact[]>([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setMessage("");
    const text = await file.text();
    const parsed = file.name.toLowerCase().endsWith(".vcf") || file.type === "text/vcard" ? parseVcf(text) : parseCsv(text);
    setContacts(parsed);
    if (!parsed.length) setMessage("No contacts found. Choose a VCF or CSV with a name column.");
  }

  function save() {
    startTransition(async () => {
      try {
        const result = await importContacts(contacts);
        setMessage(`${result.imported} contact${result.imported === 1 ? "" : "s"} added${result.skipped ? ` · ${result.skipped} already in your list` : ""}.`);
        setContacts([]);
        setFileName("");
      } catch {
        setMessage("Couldn’t import contacts. Check your connection and try again.");
      }
    });
  }

  return <div className="import-card">
    <div className="import-card-heading"><span className="import-glyph">♧</span><div><h2>Bring your contacts along</h2><p>Upload a .vcf contact card file or a .csv spreadsheet. Existing contacts are skipped automatically.</p></div></div>
    <label className="upload-zone"><input type="file" accept=".vcf,.csv,text/vcard,text/csv" onChange={(event) => void handleFile(event.target.files?.[0])} /><span className="upload-icon">↑</span><strong>{fileName || "Choose a file to upload"}</strong><span>VCF or CSV · names, phone numbers and email addresses</span><span className="button button-outline">Browse files</span></label>
    {contacts.length > 0 && <div className="import-preview"><div className="preview-top"><div><strong>{contacts.length} contacts found</strong><span>Ready to add to your address book</span></div><button type="button" onClick={save} disabled={pending} className="button button-primary">{pending ? "Adding contacts…" : `Add ${contacts.length} contacts`}</button></div><div className="contact-preview-list">{contacts.slice(0, 4).map((contact, index) => <div key={`${contact.name}-${index}`}><span className="contact-avatar">{contact.name.slice(0, 1).toUpperCase()}</span><strong>{contact.name}</strong><span>{contact.phone || contact.email || "No number or email"}</span></div>)}{contacts.length > 4 && <p>and {contacts.length - 4} more…</p>}</div></div>}
    {message && <p className="import-message" role="status">{message}</p>}
  </div>;
}
