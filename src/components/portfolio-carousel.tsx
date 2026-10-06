"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function PortfolioCarousel({
  children,
  names,
  compact = false,
}: {
  children: ReactNode;
  names: string[];
  compact?: boolean;
}) {
  const [ref, api] = useEmblaCarousel({ align: "start", loop: false });
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!api) return;
    const sync = () => setSelected(api.selectedScrollSnap());
    sync();
    api.on("select", sync).on("reInit", sync);
    return () => {
      api.off("select", sync).off("reInit", sync);
    };
  }, [api]);
  const go = (index: number) =>
    api?.scrollTo(
      index,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  return (
    <div
      className={`portfolio-carousel${compact ? " portfolio-carousel-compact" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Orbisy’s portfolio"
      data-ready={Boolean(api)}
    >
      <div
        className="portfolio-viewport"
        ref={ref}
        tabIndex={0}
        aria-label="Use left and right arrow keys to browse projects"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            go(
              Math.max(
                0,
                Math.min(
                  names.length - 1,
                  selected + (event.key === "ArrowRight" ? 1 : -1),
                ),
              ),
            );
          }
        }}
      >
        <div className="portfolio-track">
          {Children.map(children, (child, index) => (
            <div
              className="portfolio-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${names.length}: ${names[index]}`}
              aria-hidden={api ? selected !== index : undefined}
              inert={api ? selected !== index : undefined}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      <div className="portfolio-controls">
        <button
          type="button"
          aria-label="Previous portfolio project"
          disabled={!api || selected === 0}
          onClick={() => go(selected - 1)}
        >
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
        <div className="portfolio-selectors">
          {names.map((name, index) => (
            <button
              type="button"
              key={name}
              aria-label={`Show ${name}`}
              aria-pressed={selected === index}
              disabled={!api}
              onClick={() => go(index)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className="portfolio-position" aria-live="polite" aria-atomic="true">
          {selected + 1} / {names.length}
        </p>
        <button
          type="button"
          aria-label="Next portfolio project"
          disabled={!api || selected === names.length - 1}
          onClick={() => go(selected + 1)}
        >
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
