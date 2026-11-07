"use server";

import { redirect } from "next/navigation";
import { writeClient } from "@/sanity/lib/client";
import {
  createStitchingRequest as saveStitchingRequest,
  refreshAfterWrite,
  updateOrderStatus as saveOrderStatus,
  updateStitchingRequest as saveStitchingRequestUpdate,
} from "./order-mutations";

function requireToken() {
  if (!process.env.SANITY_SILVENTORY_API_TOKEN) {
    throw new Error("SANITY_SILVENTORY_API_TOKEN is not configured.");
  }
}

export type ImportedContact = { name: string; phone?: string; email?: string };

export async function importContacts(contacts: ImportedContact[]) {
  requireToken();
  const cleaned = contacts
    .map((contact) => ({
      name: contact.name.trim(),
      phone: contact.phone?.trim() || undefined,
      email: contact.email?.trim() || undefined,
    }))
    .filter((contact) => contact.name);

  const existing: { phone?: string; email?: string }[] = await writeClient.fetch(
    `*[_type == "contact"]{phone, email}`,
  );
  const keys = new Set(
    existing.flatMap((contact) => [
      contact.phone && `p:${contact.phone.replace(/\D/g, "")}`,
      contact.email && `e:${contact.email.toLowerCase()}`,
    ].filter(Boolean) as string[]),
  );
  const unique = cleaned.filter((contact) => {
    const phoneKey = contact.phone && `p:${contact.phone.replace(/\D/g, "")}`;
    const emailKey = contact.email && `e:${contact.email.toLowerCase()}`;
    if ((phoneKey && keys.has(phoneKey)) || (emailKey && keys.has(emailKey))) return false;
    if (phoneKey) keys.add(phoneKey);
    if (emailKey) keys.add(emailKey);
    return true;
  });

  if (unique.length) {
    const transaction = writeClient.transaction();
    unique.forEach((contact) => transaction.create({ _type: "contact", ...contact }));
    await transaction.commit();
  }
  refreshAfterWrite(["contacts"], ["/", "/contacts"]);
  return { imported: unique.length, skipped: cleaned.length - unique.length };
}

export async function createStitchingRequest(formData: FormData) {
  await saveStitchingRequest(formData);
  redirect("/?created=1");
}

export async function updateOrderStatus(formData: FormData) {
  await saveOrderStatus(formData);
}

export async function updateStitchingRequest(formData: FormData) {
  await saveStitchingRequestUpdate(formData);
  const id = String(formData.get("orderId") || "");
  redirect(`/orders/${id}?saved=1`);
}
