"use client";

import { FormEvent, useState } from "react";
import { withBasePath } from "@/lib/base-path";

type LeadFormProps = {
  source?: string;
  propertyReference?: string;
  propertyTitle?: string;
  listing?: boolean;
};

export function LeadForm({ source = "general", propertyReference, propertyTitle, listing = false }: LeadFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const listingDetails = listing ? [
      data.intent ? `Objective: ${data.intent}` : "",
      data.community ? `Community / building: ${data.community}` : "",
      data.propertyType ? `Property type: ${data.propertyType}` : "",
      data.timing ? `Preferred timing: ${data.timing}` : "",
    ].filter(Boolean).join("\n") : "";
    const message = [listingDetails, data.message].filter(Boolean).join("\n\n");
    try {
      const response = await fetch(withBasePath("/api/leads"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, message, source, propertyReference, propertyTitle }) });
      if (!response.ok) throw new Error("Request failed");
      form.reset(); setStatus("success");
    } catch { setStatus("error"); }
  }
  return <form className="lead-form" onSubmit={submit}>
    <label className="honey" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
    <label><span>Name</span><input name="name" required autoComplete="name" placeholder="Your full name" /></label>
    <div className="form-split"><label><span>Email</span><input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label><label><span>Phone</span><input name="phone" type="tel" required autoComplete="tel" placeholder="+971" /></label></div>
    {listing && <><div className="form-split"><label><span>Objective</span><select name="intent" required defaultValue=""><option value="" disabled>Select one</option><option value="Sell">Sell</option><option value="Lease">Lease</option><option value="Appraisal first">Appraisal first</option></select></label><label><span>Property type</span><select name="propertyType" required defaultValue=""><option value="" disabled>Select one</option><option>Apartment</option><option>Villa</option><option>Townhouse</option><option>Penthouse</option><option>Commercial</option></select></label></div><label><span>Community and building</span><input name="community" required placeholder="e.g. Dubai Marina, building name" /></label><label><span>Preferred timing</span><select name="timing" defaultValue="Within 30 days"><option>Immediately</option><option>Within 30 days</option><option>Within 3 months</option><option>Exploring options</option></select></label></>}
    <label><span>{listing ? "Property notes" : "How can we help?"}</span><textarea name="message" rows={4} placeholder={listing ? "Bedrooms, condition, occupancy and any timing considerations" : "Tell us what you are looking for"} /></label>
    <label className="consent"><input name="consent" type="checkbox" value="yes" required /><span>I agree to be contacted about my enquiry and accept the privacy policy.</span></label>
    <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending..." : listing ? "Request a private appraisal" : "Send enquiry"}</button>
    <p className={`form-status ${status}`} aria-live="polite">{status === "success" ? "Your enquiry has been delivered to our advisory desk." : status === "error" ? "We couldn't deliver your enquiry. Please call +971 56 621 5655." : ""}</p>
  </form>;
}
