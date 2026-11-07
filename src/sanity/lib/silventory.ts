import { client } from "@/sanity/lib/client";

export type Contact = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
};

export type Order = {
  _id: string;
  title: string;
  requestDate: string;
  expectedDeliveryDate: string;
  timeRequiredHours: number;
  status: "received" | "inProgress" | "ready" | "delivered" | "cancelled";
  deliveredAt?: string;
  comments?: string;
  customer?: Contact;
  clothPhoto?: { asset?: { _ref?: string } };
};

export async function getContacts(): Promise<Contact[]> {
  return client.fetch(
    `*[_type == "contact"] | order(name asc) { _id, name, phone, email }`,
    {},
    { cache: "no-store" },
  );
}

export async function getOrders(): Promise<Order[]> {
  return client.fetch(
    `*[_type == "stitchingRequest"] | order(requestDate asc, _createdAt asc) {
      _id, title, requestDate, expectedDeliveryDate, timeRequiredHours, status,
      comments, clothPhoto, deliveredAt, "customer": customer->{_id, name, phone, email}
    }`,
    {},
    { cache: "no-store" },
  );
}

export function localDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isOpen(order: Order) {
  return order.status !== "delivered" && order.status !== "cancelled";
}
