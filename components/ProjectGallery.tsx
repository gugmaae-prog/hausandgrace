"use client";

import { useEffect, useMemo, useState } from "react";

type Collection = { label: string; images: string[] };

export function ProjectGallery({ title, gallery, exteriors, interiors, floorplans }: { title: string; gallery: string[]; exteriors: string[]; interiors: string[]; floorplans: string[] }) {
  const collections = useMemo<Collection[]>(() => [
    { label: "Album", images: gallery },
    { label: "Exteriors", images: exteriors },
    { label: "Interiors", images: interiors },
    { label: "Floor plans", images: floorplans },
  ].filter((collection) => collection.images.length > 0), [exteriors, floorplans, gallery, interiors]);
  const [active, setActive] = useState(collections[0]?.label || "Album");
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const images = collections.find((collection) => collection.label === active)?.images || gallery;
  const current = images[index] || images[0];

  function selectCollection(label: string) { setActive(label); setIndex(0); }
  function previous() { setIndex((value) => (value - 1 + images.length) % images.length); }
  function next() { setIndex((value) => (value + 1) % images.length); }

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % images.length);
    }
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keydown); };
  }, [expanded, images.length]);

  if (!current) return null;
  return <section id="project-media" className="project-gallery album-gallery">
    <div className="gallery-heading"><div><p className="kicker">Project media library</p><h2>Architecture, interiors and layouts.</h2><p className="gallery-intro">Every available visual is organised by collection, so each part of the development can be reviewed without a wall of disconnected images.</p></div><div className="gallery-tabs" role="tablist" aria-label="Project media collections">{collections.map((collection) => <button type="button" key={collection.label} className={active === collection.label ? "active" : ""} onClick={() => selectCollection(collection.label)} role="tab" aria-selected={active === collection.label}>{collection.label}<span>{collection.images.length}</span></button>)}</div></div>
    <div className={`album-stage${active === "Floor plans" ? " floorplan-stage" : ""}`}>
      <button type="button" className="album-main" onClick={() => setExpanded(true)} aria-label={`Open ${title} image ${index + 1} full screen`}><img src={current} alt={`${title} ${active.toLowerCase()} image ${index + 1}`} /><span>Open full screen</span></button>
      <aside className="album-sidebar"><div><span>{active}</span><strong>{String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</strong></div><p>Use the controls or thumbnail strip to move through the complete project collection.</p><div className="album-controls"><button type="button" onClick={previous}>Previous</button><button type="button" onClick={next}>Next</button></div></aside>
    </div>
    <div className={`album-thumbnails${active === "Floor plans" ? " floorplan-thumbnails" : ""}`} aria-label={`${active} thumbnails`}>{images.map((image, imageIndex) => <button type="button" key={image} className={imageIndex === index ? "active" : ""} onClick={() => setIndex(imageIndex)} aria-label={`Show image ${imageIndex + 1}`} aria-current={imageIndex === index ? "true" : undefined}><img src={image} loading={imageIndex > 8 ? "lazy" : "eager"} alt="" /><span>{String(imageIndex + 1).padStart(2, "0")}</span></button>)}</div>
    {expanded && <div className="album-lightbox" role="dialog" aria-modal="true" aria-label={`${title} full-screen gallery`}><button type="button" className="album-close" onClick={() => setExpanded(false)}>Close</button><button type="button" className="album-lightbox-previous" onClick={previous}>Previous</button><img src={current} alt={`${title} full-screen image ${index + 1}`} /><button type="button" className="album-lightbox-next" onClick={next}>Next</button><p>{active} · {index + 1} of {images.length}</p></div>}
  </section>;
}
