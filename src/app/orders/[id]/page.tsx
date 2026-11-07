import { notFound } from "next/navigation";
import { PageHeading } from "../../components";
import { Header } from "../../interactions";
import { updateStitchingRequest } from "../../actions";
import { ClothPhotoPicker, ContactPicker } from "../../interactions";
import { getOrder, getContacts } from "@/sanity/lib/silventory";

export const instant = false;

const statuses = [
  ["received", "Received"],
  ["inProgress", "In progress"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
] as const;

export default async function EditOrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const [order, contacts] = await Promise.all([getOrder(id), getContacts()]);
  if (!order) notFound();

  return <><Header /><main className="app-main interior-page edit-order-page">
    <PageHeading eyebrow="Order details" title="Edit this stitching request." description="Update the customer, cloth, timing, or progress for this order." />
    <form action={updateStitchingRequest} className="order-form edit-form">
      <input type="hidden" name="orderId" value={order._id} />
      <section className="form-section"><div className="form-section-title"><span>01</span><div><h2>The customer and order</h2><p>Change who this piece is for or update its name.</p></div></div>
        <div className="field-block"><label htmlFor="contactId">Customer <i>*</i></label><ContactPicker contacts={contacts} initialContactId={order.customer?._id || ""} /></div>
        <div className="field-block"><label htmlFor="title">Order name <i>*</i></label><input id="title" name="title" required defaultValue={order.title} /></div>
      </section>
      <section className="form-section"><div className="form-section-title"><span>02</span><div><h2>Cloth photo and notes</h2><p>Attach a replacement photo or update the details.</p></div></div>
        <div className="field-block"><label>Cloth photo</label><ClothPhotoPicker required={false} currentPhotoName="Current cloth photo is saved · select a new one to replace it" /></div>
        <div className="field-block"><label htmlFor="comments">Extra comments <span className="optional">Optional</span></label><textarea id="comments" name="comments" rows={4} defaultValue={order.comments || ""} /></div>
      </section>
      <section className="form-section"><div className="form-section-title"><span>03</span><div><h2>Timing and progress</h2><p>Adjust the schedule, work estimate, or status.</p></div></div>
        <div className="form-grid"><div className="field-block"><label htmlFor="requestDate">Date received <i>*</i></label><input id="requestDate" name="requestDate" type="date" required defaultValue={order.requestDate} /></div><div className="field-block"><label htmlFor="expectedDeliveryDate">Expected delivery <i>*</i></label><input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" required defaultValue={order.expectedDeliveryDate} /></div></div>
        <div className="form-grid"><div className="field-block"><label htmlFor="timeRequiredHours">Estimated sewing time <i>*</i></label><div className="select-wrap"><select id="timeRequiredHours" name="timeRequiredHours" required defaultValue={order.timeRequiredHours}>{Array.from({ length: 24 }, (_, index) => <option value={index + 1} key={index}>{index + 1} {index === 0 ? "hour" : "hours"}</option>)}</select><span>⌄</span></div></div><div className="field-block"><label htmlFor="status">Order status</label><div className="select-wrap"><select id="status" name="status" required defaultValue={order.status === "ready" ? "" : order.status}>{order.status === "ready" && <option value="" disabled>Choose a status</option>}{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span>⌄</span></div></div></div>
      </section>
      <div className="form-actions"><p>Changes save to the order book.</p><button className="button button-primary submit-order" type="submit">Save order changes <span>→</span></button></div>
    </form>
    <footer className="app-footer"><span>silventory<span className="brand-dot">.</span> made for the work of your hands</span><span>Small steps, beautiful stitches.</span></footer>
  </main></>;
}
