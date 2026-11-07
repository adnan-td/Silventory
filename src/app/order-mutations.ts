import { revalidatePath, revalidateTag } from "next/cache";
import { writeClient } from "@/sanity/lib/client";

function requireToken() {
  if (!process.env.SANITY_SILVENTORY_API_TOKEN) {
    throw new Error("SANITY_SILVENTORY_API_TOKEN is not configured.");
  }
}

export function refreshAfterWrite(tags: string[], paths: string[]) {
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch (error) {
      console.error(`Sanity write succeeded, but cache tag "${tag}" could not be refreshed.`, error);
    }
  }
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(`Sanity write succeeded, but path "${path}" could not be revalidated.`, error);
    }
  }
}

function getClothPhoto(formData: FormData) {
  return ["cameraPhoto", "clothPhoto"]
    .map((field) => formData.get(field))
    .find((photo): photo is File => photo instanceof File && photo.size > 0);
}

export async function createStitchingRequest(formData: FormData) {
  requireToken();
  const title = String(formData.get("title") || "").trim();
  const requestDate = String(formData.get("requestDate") || "");
  const expectedDeliveryDate = String(formData.get("expectedDeliveryDate") || "");
  const timeRequiredHours = Number(formData.get("timeRequiredHours"));
  const photo = getClothPhoto(formData);
  const contactId = String(formData.get("contactId") || "");
  const newContactName = String(formData.get("newContactName") || "").trim();
  const orderId = String(formData.get("orderId") || "");
  const newContactId = String(formData.get("newContactId") || "");

  if (!orderId || !title || !requestDate || !expectedDeliveryDate ||
      expectedDeliveryDate < requestDate ||
      !Number.isInteger(timeRequiredHours) || timeRequiredHours < 1 || timeRequiredHours > 24) {
    throw new Error("Complete the required fields.");
  }
  if (newContactName && !newContactId) {
    throw new Error("Could not save the new customer. Please reload and try again.");
  }
  if (photo && !photo.type.startsWith("image/")) {
    throw new Error("Please choose an image for the cloth photo.");
  }

  const customerId = newContactName ? newContactId : contactId;
  if (!customerId) throw new Error("Choose a customer or enter a new customer name.");

  const transaction = writeClient.transaction();
  if (newContactName) {
    transaction.createIfNotExists({
      _id: newContactId,
      _type: "contact",
      name: newContactName,
      phone: String(formData.get("newContactPhone") || "").trim() || undefined,
      email: String(formData.get("newContactEmail") || "").trim() || undefined,
    });
  }

  const clothPhoto = photo
    ? await writeClient.assets.upload("image", photo, {
        filename: photo.name || "cloth-photo",
        contentType: photo.type || undefined,
      })
    : undefined;
  transaction.createIfNotExists({
    _id: orderId,
    _type: "stitchingRequest",
    title,
    customer: { _type: "reference", _ref: customerId },
    ...(clothPhoto && { clothPhoto: { _type: "image", asset: { _type: "reference", _ref: clothPhoto._id } } }),
    requestDate,
    expectedDeliveryDate,
    timeRequiredHours,
    comments: String(formData.get("comments") || "").trim() || undefined,
    status: "received",
  });
  await transaction.commit();

  refreshAfterWrite(
    newContactName ? ["orders", "contacts"] : ["orders"],
    ["/", "/orders", ...(newContactName ? ["/contacts"] : [])],
  );
}

export async function updateOrderStatus(formData: FormData) {
  requireToken();
  const id = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["received", "inProgress", "delivered", "cancelled"].includes(status)) {
    throw new Error("Invalid order update.");
  }
  await writeClient.patch(id).set({
    status,
    ...(status === "delivered" ? { deliveredAt: new Date().toISOString() } : { deliveredAt: null }),
  }).commit();
  refreshAfterWrite(["orders", `order:${id}`], ["/", "/orders", `/orders/${id}`]);
}

export async function updateStitchingRequest(formData: FormData) {
  requireToken();
  const id = String(formData.get("orderId") || "");
  const title = String(formData.get("title") || "").trim();
  const customerId = String(formData.get("contactId") || "");
  const requestDate = String(formData.get("requestDate") || "");
  const expectedDeliveryDate = String(formData.get("expectedDeliveryDate") || "");
  const timeRequiredHours = Number(formData.get("timeRequiredHours"));
  const status = String(formData.get("status") || "received");
  const photo = getClothPhoto(formData);
  const validStatuses = ["received", "inProgress", "delivered", "cancelled"];
  if (!id || !title || !customerId || !requestDate || !expectedDeliveryDate || expectedDeliveryDate < requestDate ||
      !Number.isInteger(timeRequiredHours) || timeRequiredHours < 1 || timeRequiredHours > 24 || !validStatuses.includes(status)) {
    throw new Error("Check the required order details and try again.");
  }
  if (photo && !photo.type.startsWith("image/")) {
    throw new Error("Please choose an image for the cloth photo.");
  }

  const updates: Record<string, unknown> = {
    title,
    customer: { _type: "reference", _ref: customerId },
    requestDate,
    expectedDeliveryDate,
    timeRequiredHours,
    comments: String(formData.get("comments") || "").trim() || null,
    status,
    deliveredAt: status === "delivered" ? new Date().toISOString() : null,
  };
  if (photo) {
    const asset = await writeClient.assets.upload("image", photo, {
      filename: photo.name || "cloth-photo",
      contentType: photo.type || undefined,
    });
    updates.clothPhoto = { _type: "image", asset: { _type: "reference", _ref: asset._id } };
  }
  await writeClient.patch(id).set(updates).commit();
  refreshAfterWrite(["orders", `order:${id}`], ["/", "/orders", `/orders/${id}`]);
}
