"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { withBasePath } from "@/lib/base-path";

/**
 * All nine frames come from one generation batch at identical 1672x941
 * pixels. Mixed sizes crop differently under object-fit: cover and the
 * skyline jumps mid-transition. The order is the smoothest path through the
 * set (2-opt over pairwise pixel differences, endpoints pinned to blank paper
 * and the final render) rather than filename order; regenerate it with
 * scripts/order-hero-frames.mjs if frames change.
 */
const sequenceFrames = Array.from({ length: 9 }, (_, index) =>
  withBasePath(`/hero/museum-sequence-light/${String(index + 1).padStart(2, "0")}-stage.jpg`),
);

const finalFrame = sequenceFrames.length - 1;

export function InteractiveHero() {
  const frame = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const [pressed, setPressed] = useState(false);

  function setReveal(clientX: number, clientY: number, visible = true) {
    const element = frame.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    element.style.setProperty("--halo-x", `${Math.min(100, Math.max(0, x))}%`);
    element.style.setProperty("--halo-y", `${Math.min(100, Math.max(0, y))}%`);
    element.style.setProperty("--reveal-opacity", visible ? "1" : "0");

    const hero = element.closest<HTMLElement>(".home-hero");
    hero?.querySelectorAll<HTMLElement>(".hero-light-line").forEach((line) => {
      const lineRect = line.getBoundingClientRect();
      line.style.setProperty("--line-light-x", `${clientX - lineRect.left}px`);
      line.style.setProperty("--line-light-y", `${clientY - lineRect.top}px`);
      line.style.setProperty("--line-light-opacity", visible ? "1" : "0");
    });

    active.current = visible;
    setPressed(visible);
  }

  function hideReveal() {
    const element = frame.current;
    if (!element) return;
    element.style.setProperty("--reveal-opacity", "0");
    element.closest<HTMLElement>(".home-hero")
      ?.querySelectorAll<HTMLElement>(".hero-light-line")
      .forEach((line) => line.style.setProperty("--line-light-opacity", "0"));
    active.current = false;
    setPressed(false);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    setReveal(event.clientX, event.clientY, true);
  }

  function toggleTouch(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    if (active.current) hideReveal();
    else setReveal(event.clientX, event.clientY, true);
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const element = frame.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (active.current) hideReveal();
    else setReveal(rect.left + rect.width * 0.72, rect.top + rect.height * 0.52, true);
  }

  return <div
    ref={frame}
    className="interactive-hero"
    role="button"
    aria-label="An interactive Dubai skyline progressing from architectural lines to its completed form"
    aria-pressed={pressed}
    tabIndex={0}
    onBlur={hideReveal}
    onPointerLeave={hideReveal}
    onPointerMove={handlePointerMove}
    onPointerDown={toggleTouch}
    onKeyDown={handleKey}
  >
    <div className="museum-sequence" aria-hidden="true">
      {sequenceFrames.map((src, index) => <img
        className={`museum-frame${index > 0 ? " reveal-frame" : ""}`}
        src={src}
        alt=""
        key={src}
        draggable={false}
        decoding="async"
        loading="eager"
        fetchPriority={index === 0 ? "high" : "low"}
        /* Nested reveal fields:
           the final photoreal frame stays closest to the pointer while earlier
           architectural stages form a softer, wider light trail around it. */
        style={index > 0 ? { "--frame-radius": `${82 + (finalFrame - index) * 24}px` } as CSSProperties : undefined}
      />)}
    </div>
    <div className="interactive-hero-shade" aria-hidden="true" />
    <div className="interactive-hero-halo" aria-hidden="true" />
  </div>;
}
