"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeClient } from "@/sanity/lib/client";

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
  revalidatePath("/");
  revalidatePath("/contacts");
  return { imported: unique.length, skipped: cleaned.length - unique.length };
}

export async function createStitchingRequest(formData: FormData) {
  requireToken();
  const title = String(formData.get("title") || "").trim();
  const requestDate = String(formData.get("requestDate") || "");
  const expectedDeliveryDate = String(formData.get("expectedDeliveryDate") || "");
  const timeRequiredHours = Number(formData.get("timeRequiredHours"));
  const photo = formData.get("clothPhoto");
  const contactId = String(formData.get("contactId") || "");
  const newContactName = String(formData.get("newContactName") || "").trim();

  if (!title || !requestDate || !expectedDeliveryDate ||
      expectedDeliveryDate < requestDate ||
      !Number.isInteger(timeRequiredHours) || timeRequiredHours < 1 || timeRequiredHours > 24 ||
      !(photo instanceof File) || photo.size === 0 || !photo.type.startsWith("image/")) {
    throw new Error("Complete the required fields and attach a cloth photo.");
  }

  let customer = contactId;
  if (newContactName) {
    const created = await writeClient.create({
      _type: "contact",
      name: newContactName,
      phone: String(formData.get("newContactPhone") || "").trim() || undefined,
      email: String(formData.get("newContactEmail") || "").trim() || undefined,
    });
    customer = created._id;
  }
  if (!customer) throw new Error("Choose a customer or enter a new customer name.");

  const asset = await writeClient.assets.upload("image", photo, {
    filename: photo.name || "cloth-photo",
    contentType: photo.type || undefined,
  });
  await writeClient.create({
    _type: "stitchingRequest",
    title,
    customer: { _type: "reference", _ref: customer },
    clothPhoto: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
    requestDate,
    expectedDeliveryDate,
    timeRequiredHours,
    comments: String(formData.get("comments") || "").trim() || undefined,
    status: "received",
  });

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/contacts");
  redirect("/?created=1");
}

export async function updateOrderStatus(formData: FormData) {
  requireToken();
  const id = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["received", "inProgress", "ready", "delivered", "cancelled"].includes(status)) {
    throw new Error("Invalid order update.");
  }
  await writeClient.patch(id).set({
    status,
    ...(status === "delivered" ? { deliveredAt: new Date().toISOString() } : { deliveredAt: null }),
  }).commit();
  revalidatePath("/");
  revalidatePath("/orders");
}
