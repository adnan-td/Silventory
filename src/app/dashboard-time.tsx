"use client";

import { useEffect, useState } from "react";

type OrderDate = { requestDate: string; deliveredAt?: string };

export function WorkshopDate() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLabel(new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <span>{label}</span>;
}

export function WeeklyOrderCards({ orders }: { orders: OrderDate[] }) {
  const [counts, setCounts] = useState<{ received: number; delivered: number } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      setCounts({
        received: orders.filter((order) => order.requestDate && new Date(`${order.requestDate}T12:00:00`) >= weekAgo).length,
        delivered: orders.filter((order) => order.deliveredAt && new Date(order.deliveredAt) >= weekAgo).length,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [orders]);

  return <>
    <article className="stat-card">
      <div className="stat-top"><span>Orders delivered</span><span className="stat-symbol">✓</span></div>
      <strong>{counts?.delivered ?? "–"}</strong>
      <p>in the last 7 days</p>
      <span className="stat-decoration">02</span>
    </article>
    <article className="stat-card">
      <div className="stat-top"><span>Orders received</span><span className="stat-symbol">↗</span></div>
      <strong>{counts?.received ?? "–"}</strong>
      <p>in the last 7 days</p>
      <span className="stat-decoration">03</span>
    </article>
  </>;
}
