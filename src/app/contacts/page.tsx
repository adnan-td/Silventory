import { ContactImporter } from "./contact-importer";
import { PageHeading } from "../components";
import { Header } from "../interactions";
import { getContacts } from "@/sanity/lib/silventory";

export const instant = false;

export default async function ContactsPage() {
  const contacts = await getContacts();
  return <><Header /><main className="app-main interior-page contacts-page">
    <PageHeading eyebrow="Your address book" title="Good work starts with good people." description="Keep every customer’s details close, ready for the next fitting." />
    <ContactImporter />
    <section className="panel contacts-panel"><div className="section-heading"><div><p className="eyebrow">Customer list</p><h2>All contacts <span className="heading-count">{contacts.length}</span></h2></div><span className="count-badge">{contacts.length} people</span></div>
      {contacts.length ? <div className="contacts-list overflow-hidden">{contacts.map((contact) => <article className="contact-row" key={contact._id}><span className="contact-avatar">{contact.name.slice(0, 1).toUpperCase()}</span><div><h3>{contact.name}</h3><p>{contact.phone || "No phone number"}{contact.email && <> <span className="dot-separator">·</span> {contact.email}</>}</p></div><span className="contact-row-glyph">✳</span></article>)}</div> : <div className="empty-contacts"><span>♧</span><p>Your customer list is waiting. Import a contact file above to get started.</p></div>}
    </section>
    <footer className="app-footer"><span>silventory<span className="brand-dot">.</span> made for the work of your hands</span><span>Small steps, beautiful stitches.</span></footer>
  </main></>;
}
