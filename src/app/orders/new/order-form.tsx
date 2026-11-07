"use client";

import { useEffect, useState } from "react";
import type { Contact } from "@/sanity/lib/silventory";
import { ClothPhotoPicker, ContactPicker } from "../../interactions";
import { OrderSubmitForm } from "../../order-submit-form";

function todayInKolkata() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function OrderForm({ contacts, pendingHours, orderId, newContactId }: { contacts: Contact[]; pendingHours: number; orderId: string; newContactId: string }) {
  const [newContact, setNewContact] = useState(false);
  const [hours, setHours] = useState(2);
  const [requestDate, setRequestDate] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const completionDays = Math.ceil((pendingHours + hours) / 5);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const today = todayInKolkata();
      setRequestDate(today);
      setExpectedDeliveryDate(today);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <OrderSubmitForm
    action="/api/orders"
    destination="/?created=1"
    className="order-form"
    hint={<><i>*</i> Required fields</>}
    submitLabel="Add to the order queue"
  >
    <input type="hidden" name="orderId" value={orderId} />
    <input type="hidden" name="newContactId" value={newContactId} />
    <div className="form-section"><div className="form-section-title"><span>01</span><div><h2>The customer</h2><p>Who are we making this for?</p></div></div>
      <div className="field-block"><label htmlFor="contactId">Choose from your contacts</label><ContactPicker contacts={contacts} disabled={newContact} required={!newContact} /></div>
      <div className="or-divider"><span>or add someone new</span></div>
      <button type="button" className={`new-contact-toggle ${newContact ? "selected" : ""}`} onClick={() => setNewContact(!newContact)}><span className="toggle-check">{newContact ? "✓" : "+"}</span>{newContact ? "New customer details" : "Create a new customer"}<span className="toggle-chevron">{newContact ? "−" : "＋"}</span></button>
      {newContact && <div className="new-contact-fields"><div className="field-block"><label htmlFor="newContactName">Customer name <i>*</i></label><input required id="newContactName" name="newContactName" placeholder="e.g. Asha Mehta" /></div><div className="form-grid"><div className="field-block"><label htmlFor="newContactPhone">Phone number</label><input id="newContactPhone" name="newContactPhone" type="tel" placeholder="+91 98765 43210" /></div><div className="field-block"><label htmlFor="newContactEmail">Email address</label><input id="newContactEmail" name="newContactEmail" type="email" placeholder="asha@example.com" /></div></div></div>}
    </div>

    <div className="form-section"><div className="form-section-title"><span>02</span><div><h2>What are we stitching?</h2><p>Add the piece and a little inspiration.</p></div></div>
      <div className="field-block"><label htmlFor="title">Order name <i>*</i></label><input id="title" name="title" required placeholder="e.g. Lavender silk kurta" /></div>
      <div className="field-block"><label>Cloth photo <span className="optional">Optional</span></label><ClothPhotoPicker /></div>
      <div className="field-block"><label htmlFor="comments">A few extra notes <span className="optional">Optional</span></label><textarea id="comments" name="comments" rows={3} placeholder="Measurements, style notes, fabric details…" /></div>
    </div>

    <div className="form-section"><div className="form-section-title"><span>03</span><div><h2>The timing</h2><p>Set the dates and estimate the sewing time.</p></div></div>
      <div className="form-grid"><div className="field-block"><label htmlFor="requestDate">Date received <i>*</i></label><input id="requestDate" name="requestDate" type="date" required value={requestDate} onChange={(event) => setRequestDate(event.target.value)} /></div><div className="field-block"><label htmlFor="expectedDeliveryDate">Expected delivery <i>*</i></label><input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" required value={expectedDeliveryDate} onChange={(event) => setExpectedDeliveryDate(event.target.value)} /></div></div>
      <div className="field-block"><label htmlFor="timeRequiredHours">Estimated sewing time <i>*</i></label><div className="select-wrap"><select id="timeRequiredHours" name="timeRequiredHours" value={hours} onChange={(event) => setHours(Number(event.target.value))}>{Array.from({ length: 24 }, (_, index) => <option value={index + 1} key={index}>{index + 1} {index === 0 ? "hour" : "hours"}</option>)}</select><span>⌄</span></div></div>
      <aside className="completion-note"><span className="completion-icon">◷</span><p><strong>This order is {pendingHours} hours into the queue.</strong><br />With your existing work ahead, you’ll finish this order in about <strong>{completionDays} {completionDays === 1 ? "workday" : "workdays"}</strong>, at 5 hours of sewing a day.</p></aside>
    </div>
  </OrderSubmitForm>;
}
