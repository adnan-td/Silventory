import Link from "next/link";
import Image from "next/image";
import { updateOrderStatus } from "./actions";
import { urlFor } from "@/sanity/lib/image";
import type { Order } from "@/sanity/lib/silventory";

export function Header() {
  return (
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-mark">s</span><span>silventory<span className="brand-dot">.</span></span></Link>
      <nav aria-label="Main navigation">
        <Link href="/">Dashboard</Link>
        <Link href="/orders">Orders</Link>
        <Link href="/contacts">Contacts</Link>
      </nav>
      <Link className="button button-primary top-action" href="/orders/new"><span>＋</span> New order</Link>
    </header>
  );
}

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
        <div className="order-thumb">{photo ? <Image src={photo} alt="" width={120} height={120} unoptimized /> : <span>✳</span>}</div>
        <div className="order-main">
          <div className="order-heading"><h3>{order.title}</h3><StatusPill status={order.status} /></div>
          <p>{order.customer?.name || "Customer"}<span className="dot-separator">·</span>{order.timeRequiredHours}h of work</p>
        </div>
        <div className="order-date"><span>Expected delivery</span><strong>{formatDate(order.expectedDeliveryDate)}</strong></div>
        {!compact && <form action={updateOrderStatus} className="status-form">
          <input type="hidden" name="orderId" value={order._id} />
          <select aria-label={`Update ${order.title} status`} name="status" defaultValue={order.status}>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="submit" className="status-save">Save</button>
        </form>}
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
