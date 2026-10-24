"use client";
import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronDown, Compass, Layers3 } from "lucide-react";
type NavigationItem = { label: string; description: string; href: string };

export function PublicNavigation({
  services,
  industries,
}: {
  services: NavigationItem[];
  industries: NavigationItem[];
}) {
  const root = useRef<HTMLElement>(null);
  const closeAll = useCallback(
    () =>
      root.current
        ?.querySelectorAll<HTMLDetailsElement>("details[open]")
        .forEach((detail) => {
          detail.open = false;
        }),
    [],
  );
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) closeAll();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const open =
        root.current?.querySelector<HTMLDetailsElement>("details[open]");
      if (!open) return;
      const restoreFocus = open.contains(document.activeElement);
      closeAll();
      if (restoreFocus) open.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [closeAll]);
  return (
    <nav
      ref={root}
      className="orbisy-navigation"
      aria-label="Public navigation"
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          closeAll();
      }}
    >
      {[
        {
          id: "services",
          label: "Services",
          heading: "Choose what moves your business forward.",
          links: services,
          footer: "Explore services & engagements",
          href: "/#services",
          icon: Layers3,
        },
        {
          id: "industries",
          label: "Industries",
          heading: "Built around the business you run.",
          links: industries,
          footer: "Explore all industries",
          href: "/industries",
          icon: Compass,
        },
      ].map((group) => (
        <details
          className="nav-disclosure"
          key={group.id}
          onToggle={(event) => {
            if (event.currentTarget.open)
              root.current
                ?.querySelectorAll<HTMLDetailsElement>("details[open]")
                .forEach((detail) => {
                  if (detail !== event.currentTarget) detail.open = false;
                });
          }}
        >
          <summary aria-controls={`navigation-${group.id}`}>
            <group.icon size={15} aria-hidden="true" />
            {group.label}
            <ChevronDown size={13} className="nav-chevron" aria-hidden="true" />
          </summary>
          <div className="orbisy-mega-panel" id={`navigation-${group.id}`}>
            <div className="mega-main">
              <p className="eyebrow">
                <span />
                {group.label}
              </p>
              <h2>{group.heading}</h2>
              <div className="mega-link-grid">
                {group.links.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="mega-link"
                    onClick={closeAll}
                  >
                    <span className="mega-link-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{link.label}</strong>
                      <small>
                        {group.id === "services"
                          ? link.description.split(". ")[0] + "."
                          : link.description}
                      </small>
                    </span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </div>
              <Link
                className="mega-footer-link"
                href={group.href}
                onClick={closeAll}
              >
                {group.footer}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <aside className="mega-feature">
              <div className="mega-orbit" aria-hidden="true" />
              <p className="eyebrow">From idea to implementation</p>
              <Image
                src="/work/orbisy-design-process.webp"
                alt="Illustrative Orbisy wireframe, visual design, and refinement concept"
                width={1586}
                height={992}
                sizes="(max-width: 760px) 90vw, 300px"
              />
              <h3>
                Your business.
                <br />A clearer next step.
              </h3>
              <p>
                Explore live website work and a look inside the Orbisy design
                process.
              </p>
              <Link
                href="/work#orbisy-design-process"
                className="text-link"
                onClick={closeAll}
              >
                Explore Orbisy’s portfolio →
              </Link>
            </aside>
          </div>
        </details>
      ))}
      <Link href="/work" onClick={closeAll}>
        Our Work
      </Link>
      <Link href="/pricing" onClick={closeAll}>
        Pricing
      </Link>
      <Link href="/#about" onClick={closeAll}>
        About
      </Link>
    </nav>
  );
}
