import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ToolDirectory, ToolGuide } from "@/components/admin/tool-guide";
import { OperatingSettingsForm } from "@/components/admin/operating-settings-form";
import { adminToolGuides, type AdminToolKey } from "@/lib/admin-tool-guides";
import { exampleOperatingSettings } from "@/lib/admin-settings-example";
import "../../admin-portal/admin.css";
import "../workspace/review.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Supporting tools guide preview",
  robots: { index: false, follow: false, nocache: true },
};
export default async function ToolsPreview({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  if (
    process.env.VERCEL_ENV !== "preview" &&
    process.env.NODE_ENV !== "development"
  )
    notFound();
  const requested = (await searchParams).tool;
  const tool =
    requested && Object.hasOwn(adminToolGuides, requested)
      ? (requested as AdminToolKey)
      : undefined;
  return (
    <AdminShell email="" reviewMode reviewArea="tools" reviewView={tool}>
      <section className="workspace-review-banner" aria-label="Design preview">
        <strong>Tools guide preview · Fictional example settings</strong>
        <p>
          Instructions use the real proposed portal components. No live records
          or settings are read. Example settings are disabled and cannot be
          saved here. The real tools still require administrator sign-in. This
          route returns 404 in production.
        </p>
        <nav aria-label="Preview screens">
          <Link href="/preview/tools">Tools directory</Link>
          <Link href="/preview/tools?tool=settings">
            Settings & field explanations
          </Link>
          <Link href="/preview/tools?tool=preflight">
            Website check instructions
          </Link>
        </nav>
      </section>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Supporting tools</p>
          <h1>
            {tool ? adminToolGuides[tool].title : "Tools & workflow guide"}
          </h1>
        </div>
      </header>
      {tool ? (
        <>
          <ToolGuide tool={tool} expanded preview />
          {tool === "settings" && (
            <OperatingSettingsForm
              settings={exampleOperatingSettings}
              readOnly
            />
          )}
        </>
      ) : (
        <ToolDirectory preview />
      )}
    </AdminShell>
  );
}
