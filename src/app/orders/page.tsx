import { Header, OrderList, PageHeading } from "../components";
import { getOrders } from "@/sanity/lib/silventory";

export const instant = false;

export default async function OrdersPage() {
  const orders = await getOrders();
  const active = orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled");
  return <><Header /><main className="app-main interior-page">
    <PageHeading eyebrow="The order book" title="Every piece, in its place." description="Keep an eye on every fitting, from the first note to the final handoff." />
    <div className="orders-summary"><div><span>Open work</span><strong>{active.length}</strong></div><div><span>Hours in queue</span><strong>{active.reduce((sum, order) => sum + order.timeRequiredHours, 0)}<small>h</small></strong></div><div><span>Ready for pickup</span><strong>{orders.filter((order) => order.status === "ready").length}</strong></div><div><span>Delivered</span><strong>{orders.filter((order) => order.status === "delivered").length}</strong></div></div>
    <section className="panel orders-panel"><div className="section-heading"><div><p className="eyebrow">Oldest request first</p><h2>All orders <span className="heading-count">{orders.length}</span></h2></div></div><OrderList orders={orders} /></section>
    <footer className="app-footer"><span>silventory<span className="brand-dot">.</span> made for the work of your hands</span><span>Small steps, beautiful stitches.</span></footer>
  </main></>;
}
