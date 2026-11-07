"use client";

import { useId, useState } from "react";
import type { Order } from "@/sanity/lib/silventory";
import { OrderList } from "./components";

const statuses: { value: Order["status"]; label: string }[] = [
  { value: "inProgress", label: "In progress" },
  { value: "received", label: "Received" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function isOrderStatus(value: string): value is Order["status"] {
  return statuses.some((status) => status.value === value);
}

export function FilterableOrderList({ orders }: { orders: Order[] }) {
  const filterId = useId();
  const [status, setStatus] = useState<Order["status"] | "all">("all");
  const visibleOrders =
    status === "all" ? orders : orders.filter((order) => order.status === status);
  function updateStatus(value: string) {
    if (value === "all" || isOrderStatus(value)) setStatus(value);
  }

  return (
    <>
      <div className="order-filter">
        <label htmlFor={filterId}>Status</label>
        <select
          id={filterId}
          className="order-filter-select"
          value={status}
          onChange={(event) => updateStatus(event.currentTarget.value)}
        >
          <option value="all">All statuses</option>
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      {visibleOrders.length || status === "all" ? (
        <OrderList orders={visibleOrders} />
      ) : (
        <div className="empty-state">
          <span className="empty-icon">✳</span>
          <h3>No matching orders</h3>
          <p>There are no orders with this status.</p>
        </div>
      )}
    </>
  );
}
