"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronDown, Compass, Layers3, X } from "lucide-react";
const mobileQuery = "(max-width: 980px)";
function subscribeToViewport(callback: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const isMobileViewport = () => window.matchMedia(mobileQuery).matches;
const serverViewport = () => false;

type NavigationItem = { label: string; description: string; href: string };

export function PublicNavigation({
  services,
  industries,
}: {
  services: NavigationItem[];
  industries: NavigationItem[];
}) {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useSyncExternalStore(subscribeToViewport, isMobileViewport, serverViewport);
  const closeAll = useCallback(() => {
    root.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((detail) => {
      detail.open = false;
    });
    if (dialog.current?.open) dialog.current.close();
    setMobileOpen(false);
  }, []);
  useEffect(() => {
    const panel = dialog.current;
    if (!isMobile || !mobileOpen || !panel) return;
    panel.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (panel.open) panel.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, mobileOpen]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!dialog.current?.open && !root.current?.contains(event.target as Node)) closeAll();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (dialog.current?.open) {
        event.preventDefault();
        closeAll();
        return;
      }
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
  const navigation = (
    <nav
      ref={root}
      className="orbisy-navigation"
      aria-label="Public navigation"
      onBlur={(event) => {
        if (
          !isMobile &&
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
      {isMobile && <Link href="/#contact" className="button mobile-consultation" onClick={closeAll}>Request a consultation <ArrowUpRight size={18} aria-hidden="true" /></Link>}
    </nav>
  );
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="mobile-menu-trigger"
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation-drawer"
        aria-haspopup="dialog"
        onClick={() => setMobileOpen(true)}
      >
        <span className="hamburger-lines" aria-hidden="true"><span /><span /><span /></span>
      </button>
      {isMobile ? (
        <dialog
          ref={dialog}
          id="mobile-navigation-drawer"
          className="mobile-navigation-drawer"
          aria-labelledby="mobile-navigation-title"
          onCancel={(event) => { event.preventDefault(); closeAll(); }}
          onClose={() => { setMobileOpen(false); trigger.current?.focus(); }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeAll();
          }}
        >
          <div className="mobile-drawer-heading">
            <div><p className="eyebrow">Explore Orbisy</p><h2 id="mobile-navigation-title">Your next move.</h2></div>
            <button type="button" className="mobile-menu-close" aria-label="Close navigation menu" onClick={closeAll}><X size={24} aria-hidden="true" /></button>
          </div>
          {navigation}
          <p className="mobile-drawer-note">Websites. Marketing. Software.<br />Built around your business.</p>
        </dialog>
      ) : <div className="desktop-navigation">{navigation}</div>}
    </>
  );
}
