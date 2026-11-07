import { PageHeading } from "../../components";
import { Header } from "../../interactions";
import { OrderForm } from "./order-form";
import { getContacts, getOrders, isOpen, localDateString } from "@/sanity/lib/silventory";

export const instant = false;

export default async function NewOrderPage() {
  const [contacts, orders] = await Promise.all([getContacts(), getOrders()]);
  const pendingHours = orders.filter(isOpen).reduce((sum, order) => sum + order.timeRequiredHours, 0);
  return <><Header /><main className="app-main interior-page new-order-page">
    <PageHeading eyebrow="New stitching request" title="Let’s get to work." description="A few details now make for a smoother fitting later." />
    <div className="form-layout"><OrderForm contacts={contacts} pendingHours={pendingHours} today={localDateString()} /><aside className="form-aside"><div className="aside-swatch"><div className="swatch-marks">✳<span>✳</span></div><p className="eyebrow">A note for the tailor</p><h3>Good work<br />begins with<br /><em>good details.</em></h3><p>A clear cloth photo and a few helpful notes make every stitch count.</p></div><div className="aside-tip"><span>✦</span><p>We’ll add this request to the back of your queue, so earlier orders stay on track.</p></div></aside></div>
    <footer className="app-footer"><span>silventory<span className="brand-dot">.</span> made for the work of your hands</span><span>Small steps, beautiful stitches.</span></footer>
  </main></>;
}
