import Link from "next/link";
import { Header, OrderList } from "./components";
import { getOrders, isOpen } from "@/sanity/lib/silventory";

export const instant = false;

export default async function Home() {
  const orders = await getOrders();
  const today = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
  const openOrders = orders.filter(isOpen);
  const pendingHours = openOrders.reduce((sum, order) => sum + (order.timeRequiredHours || 0), 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const receivedThisWeek = orders.filter((order) => order.requestDate && new Date(`${order.requestDate}T12:00:00`) >= weekAgo).length;
  const deliveredThisWeek = orders.filter((order) => order.deliveredAt && new Date(order.deliveredAt) >= weekAgo).length;
  const todayOrders = openOrders.slice(0, 5);

  return <><Header /><main className="app-main dashboard">
    <section className="welcome-row">
      <div><p className="eyebrow">{today} <span className="eyebrow-dot">•</span> Your workshop</p><h1>Good morning<span className="purple-text">.</span></h1><p className="welcome-copy">A little look at what’s on your sewing table.</p></div>
      <Link className="button button-primary welcome-button" href="/orders/new"><span>＋</span> Add a new order</Link>
    </section>

    <section className="stats-grid" aria-label="Workshop statistics">
      <article className="stat-card stat-purple"><div className="stat-top"><span>Orders received</span><span className="stat-symbol">↗</span></div><strong>{receivedThisWeek}</strong><p>in the last 7 days</p><span className="stat-decoration">01</span></article>
      <article className="stat-card"><div className="stat-top"><span>Orders delivered</span><span className="stat-symbol">✓</span></div><strong>{deliveredThisWeek}</strong><p>in the last 7 days</p><span className="stat-decoration">02</span></article>
      <article className="stat-card"><div className="stat-top"><span>All-time orders</span><span className="stat-symbol">▤</span></div><strong>{orders.length}</strong><p>{openOrders.length} currently in the queue</p><span className="stat-decoration">03</span></article>
      <article className="stat-card stat-lilac"><div className="stat-top"><span>Work pending</span><span className="stat-symbol">◷</span></div><strong>{pendingHours}<small> hrs</small></strong><p>about {Math.ceil(pendingHours / 5)} work {Math.ceil(pendingHours / 5) === 1 ? "day" : "days"} at 5h/day</p><span className="stat-decoration">04</span></article>
    </section>

    <div className="dashboard-columns">
      <section className="panel queue-panel">
        <div className="panel-heading"><div><p className="eyebrow">The workbench</p><h2>Today’s order queue</h2><p className="panel-subtitle">First come, first served · Next 5 up</p></div><span className="count-badge">{openOrders.length} active</span></div>
        <OrderList orders={todayOrders} compact />
        {openOrders.length > 5 && <Link className="panel-footer-link" href="/orders">See all {openOrders.length} active orders <span>→</span></Link>}
      </section>
      <aside className="side-stack">
        <section className="panel rhythm-card"><div className="rhythm-icon">✳</div><p className="eyebrow">Your pace</p><h2>One stitch at a time.</h2><p>There are <strong>{pendingHours} hours</strong> of work in your queue. At five focused hours a day, you’re looking at <strong>{Math.ceil(pendingHours / 5)} days</strong> to catch up.</p><div className="pace-bar"><span style={{ width: `${Math.min(100, pendingHours % 5 / 5 * 100 || (pendingHours ? 100 : 0))}%` }} /></div><div className="pace-caption"><span>Today’s capacity</span><strong>{pendingHours ? `${Math.min(pendingHours, 5)} / 5 hrs` : "0 / 5 hrs"}</strong></div></section>
        <section className="panel quick-card"><div className="quick-icon">♧</div><div><h3>Keep your people close</h3><p>Bring your contacts in from a VCF or CSV file.</p><Link href="/contacts" className="text-link">Manage contacts <span>→</span></Link></div></section>
      </aside>
    </div>

    <section className="all-orders-preview"><div className="section-heading"><div><p className="eyebrow">In the studio</p><h2>All orders</h2></div><Link href="/orders" className="text-link">View all orders <span>→</span></Link></div><div className="preview-strip"><span className="preview-icon">▤</span><p><strong>{orders.length} orders</strong> recorded · {orders.filter((o) => o.status === "ready").length} ready for pickup · {orders.filter((o) => o.status === "delivered").length} delivered</p><Link href="/orders">Open order book <span>→</span></Link></div></section>
    <footer className="app-footer"><span>silventory<span className="brand-dot">.</span> made for the work of your hands</span><span>Small steps, beautiful stitches.</span></footer>
  </main></>;
}
