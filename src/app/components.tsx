import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { Order } from "@/sanity/lib/silventory";
import { OrderStatusSelector } from "./interactions";

const statusLabels: Record<Order["status"], string> = {
  received: "Received", inProgress: "In progress", ready: "Ready", delivered: "Delivered", cancelled: "Cancelled",
};

export function StatusPill({ status }: { status: Order["status"] }) {
  return <span className={`status-pill status-${status}`}>{statusLabels[status]}</span>;
}

export function OrderList({ orders, compact = false }: { orders: Order[]; compact?: boolean }) {
  if (!orders.length) return <div className="empty-state"><span className="empty-icon">✳</span><h3>No orders yet</h3><p>Your next stitching request will show up here.</p><Link href="/orders/new" className="text-link">Add an order <span>→</span></Link></div>;
  return <div className="order-list">
    {orders.map((order, index) => {
      const photo = order.clothPhoto?.asset?._ref ? urlFor(order.clothPhoto as never).width(120).height(120).fit("crop").url() : null;
      return <article className="order-row" key={order._id}>
        <Link href={`/orders/${order._id}`} className="order-row-link" aria-label={`Edit order: ${order.title}`}>
          <span className="order-thumb">{photo ? <Image src={photo} alt="" width={120} height={120} unoptimized /> : <span>✳</span>}</span>
          <span className="order-main">
            <span className="order-heading"><span className="order-title">{order.title}</span><StatusPill status={order.status} /></span>
            <span className="order-subline">{order.customer?.name || "Customer"}<span className="dot-separator">·</span>{order.timeRequiredHours}h of work</span>
          </span>
          <span className="order-date"><span>Expected delivery</span><strong>{formatDate(order.expectedDeliveryDate)}</strong></span>
        </Link>
        <OrderStatusSelector orderId={order._id} currentStatus={order.status} label={`Update ${order.title} status`} />
        {compact && <span className="queue-number">{String(index + 1).padStart(2, "0")}</span>}
      </article>;
    })}
  </div>;
}

export function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}
