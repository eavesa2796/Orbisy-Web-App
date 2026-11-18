import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/data/admin";
export default async function AnalyticsPage({ searchParams, }: {
    searchParams: Promise<{
        days?: string;
    }>;
}) {
    const admin = await requireAdmin();
    const requested = Number((await searchParams).days);
    const days = [7, 30, 90].includes(requested) ? requested : 30;
    let data: Awaited<ReturnType<typeof getAnalyticsSummary>> | null = null;
    try {
        data = await getAnalyticsSummary(days);
    }
    catch { }
    const maxDaily = Math.max(...(data?.daily.map((item) => Number(item.count)) ?? [1]), 1);
    return (<AdminShell email={admin.email}>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Historical archive · collection retired</p>
          <h1>Historical website reports</h1>
        </div>
        <nav className="range-tabs" aria-label="Analytics date range">
          {[7, 30, 90].map((range) => (<a className={days === range ? "active" : ""} href={`?days=${range}`} key={range}>
              {range} days
            </a>))}
        </nav>
      </header>
      <p className="notice">Orbisy’s event collector is retired. These are retained historical records, not live GA4 data. No new page-view or click events are saved here, and this archive does not delete records.</p>
      <Link className="text-link" href="/admin-portal/sales">← Sales overview</Link>
      {!data ? (<section className="admin-card empty-state">
          <h2>Historical reports are temporarily unavailable</h2>
          <p>
            No historical totals are shown because the database could not be queried. Collection remains retired.
          </p>
        </section>) : (<>
          <section className="metric-grid">
            <article className="metric-card">
              <span>Page views</span>
              <strong>{data.pageViews}</strong>
            </article>
            <article className="metric-card">
              <span>Anonymous sessions</span>
              <strong>{data.sessions}</strong>
            </article>
            <article className="metric-card">
              <span>Tracked review submissions</span>
              <strong>
                {data.eventMap.homepage_review_form_submit_success ?? 0}
              </strong>
            </article>
            <article className="metric-card">
              <span>Tracked project requests</span>
              <strong>
                {data.eventMap.project_request_form_submit_success ?? 0}
              </strong>
            </article>
          </section>
          <section className="admin-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Trend</p>
                <h2>Daily page views</h2>
              </div>
            </div>
            {data.daily.length ? (<div className="bar-chart" role="img" aria-label={`Daily page views over ${days} days`}>
                {data.daily.map((item) => (<div className="bar-column" key={item.day}>
                    <span className="bar-value">{item.count}</span>
                    <span className="bar" style={{
                        height: `${Math.max((Number(item.count) / maxDaily) * 140, 3)}px`,
                    }}/>
                    <small>{item.day.slice(5)}</small>
                  </div>))}
              </div>) : (<p className="muted">No page views in this period.</p>)}
          </section>
          <section className="admin-grid analytics-lists">
            <article className="admin-card">
              <h2>Top pages</h2>
              <ol className="rank-list">
                {data.pages.map((item) => (<li key={item.page_path}>
                    <span>{item.page_path}</span>
                    <strong>{item.count}</strong>
                  </li>))}
              </ol>
              {!data.pages.length && <p className="muted">No data yet.</p>}
            </article>
            <article className="admin-card">
              <h2>Top referrers</h2>
              <ol className="rank-list">
                {data.referrers.map((item) => (<li key={item.referrer_domain}>
                    <span>{item.referrer_domain || "Direct"}</span>
                    <strong>{item.count}</strong>
                  </li>))}
              </ol>
              {!data.referrers.length && (<p className="muted">No referrer data yet.</p>)}
            </article>
            <article className="admin-card">
              <h2>Interactions</h2>
              <ol className="rank-list">
                {Object.entries(data.eventMap)
                .filter(([name]) => name !== "page_view")
                .map(([name, count]) => (<li key={name}>
                      <span>{name.replaceAll("_", " ")}</span>
                      <strong>{count}</strong>
                    </li>))}
              </ol>
            </article>
            <article className="admin-card">
              <h2>Devices</h2>
              <ol className="rank-list">
                {data.devices.map((item) => (<li key={item.device_category}>
                    <span>{item.device_category || "Unknown"}</span>
                    <strong>{item.count}</strong>
                  </li>))}
              </ol>
            </article>
          </section>
          <section className="admin-card notice">
            <strong>What this does not collect:</strong> no names, email
            addresses, full IP addresses, cookies, persistent cross-site
            identifiers, keystrokes, session recordings, or heatmaps. Counts are
            directional, not forensic.
          </section>
        </>)}
    </AdminShell>);
}
