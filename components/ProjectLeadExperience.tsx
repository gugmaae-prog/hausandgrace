"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import { LeadForm } from "@/components/LeadForm";

type ProjectLeadExperienceProps = {
  projectTitle: string;
  source: string;
  propertyReference: string;
};

export function ProjectLeadExperience({
  projectTitle,
  source,
  propertyReference,
}: ProjectLeadExperienceProps) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  function openForm() {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  }

  useEffect(() => {
    const enquiryLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href="#enquire"]'));
    const handleEnquiryClick = (event: Event) => {
      event.preventDefault();
      openForm();
    };
    enquiryLinks.forEach((link) => link.addEventListener("click", handleEnquiryClick));

    const params = new URLSearchParams(window.location.search);
    const openFrame = params.get("enquire") === "1"
      ? window.requestAnimationFrame(openForm)
      : null;

    return () => {
      if (openFrame !== null) window.cancelAnimationFrame(openFrame);
      enquiryLinks.forEach((link) => link.removeEventListener("click", handleEnquiryClick));
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) closeForm();
  }

  return <>
    <button className="project-enquiry-float" type="button" onClick={openForm}>
      <span>Private enquiry</span>
      Check live availability
    </button>
    <div className="project-lead-modal" hidden={!open} onMouseDown={handleBackdrop}>
      <section
        className="project-lead-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-lead-title"
      >
        <button
          ref={closeButtonRef}
          className="project-lead-close"
          type="button"
          onClick={closeForm}
          aria-label="Close enquiry form"
        >
          <span aria-hidden="true" />
        </button>
        <div className="project-lead-intro">
          <p className="kicker light">Private project desk</p>
          <h2 id="project-lead-title">Request the live<br /><em>availability brief.</em></h2>
          <p>{projectTitle}</p>
          <ul>
            <li>Current units and verified pricing</li>
            <li>Payment milestones and floor plans</li>
            <li>Direct follow-up from an advisor</li>
          </ul>
        </div>
        <div className="project-lead-form-shell">
          <p>Share your details and the project desk will respond privately.</p>
          <LeadForm
            source={source}
            propertyReference={propertyReference}
            propertyTitle={projectTitle}
          />
        </div>
      </section>
    </div>
  </>;
}
