"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { importFieldNames, type ColumnMapping } from "@/lib/imports/types";

const labels: Record<(typeof importFieldNames)[number], string> = {
  businessName: "Business name",
  category: "Category",
  industry: "Industry",
  address: "Street address",
  city: "City",
  state: "State",
  postalCode: "Postal code",
  location: "General location",
  websiteUrl: "Website URL",
  email: "Public business email",
  phone: "Public business phone",
  contactName: "Contact name",
  sourceName: "Source name",
  sourceUrl: "Source URL",
  sourceIdentifier: "Source identifier",
  dateDiscovered: "Date discovered",
};

const headerAliases: Record<string, keyof ColumnMapping> = {
  business_name: "businessName",
  business: "businessName",
  company: "businessName",
  category: "category",
  industry: "industry",
  address: "address",
  city: "city",
  state: "state",
  postal_code: "postalCode",
  zip: "postalCode",
  location: "location",
  website_url: "websiteUrl",
  website: "websiteUrl",
  public_email: "email",
  email: "email",
  public_phone: "phone",
  phone: "phone",
  contact_name: "contactName",
  source_name: "sourceName",
  source_url: "sourceUrl",
  source_identifier: "sourceIdentifier",
  date_discovered: "dateDiscovered",
};

function parseHeader(text: string) {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const headers: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < firstLine.length; index += 1) {
    const character = firstLine[index];
    if (character === '"') {
      if (quoted && firstLine[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      headers.push(value.trim());
      value = "";
    } else value += character;
  }
  headers.push(value.trim());
  return headers.filter(Boolean);
}

export function CsvImportWizard({
  maxBytes,
  maxRows,
  defaultSourceName,
}: {
  maxBytes: number;
  maxRows: number;
  defaultSourceName: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function chooseFile(selected?: File) {
    setMessage("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setMessage("Choose a file ending in .csv.");
      return;
    }
    if (selected.size > maxBytes) {
      setMessage(`File exceeds the ${Math.floor(maxBytes / 1_000)} KB limit.`);
      return;
    }
    const parsedHeaders = parseHeader(await selected.slice(0, 20_000).text());
    if (!parsedHeaders.length) {
      setMessage("The CSV header row could not be read.");
      return;
    }
    const suggested: ColumnMapping = {};
    parsedHeaders.forEach((header) => {
      const field = headerAliases[header.toLowerCase().replace(/\s+/g, "_")];
      if (field && !suggested[field]) suggested[field] = header;
    });
    setFile(selected);
    setHeaders(parsedHeaders);
    setMapping(suggested);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !mapping.businessName) {
      setMessage("Select a CSV and map the Business name column.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    const values = new FormData(event.currentTarget);
    values.set("file", file);
    values.set("mapping", JSON.stringify(mapping));
    try {
      const response = await fetch("/api/admin/imports", {
        method: "POST",
        body: values,
      });
      const result = (await response.json()) as {
        batchId?: string;
        message?: string;
      };
      if (!response.ok || !result.batchId) {
        setMessage(result.message || "Import preview could not be created.");
        return;
      }
      router.push(`/admin-portal/imports/${result.batchId}`);
    } catch {
      setMessage("Import preview could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-card import-wizard" onSubmit={submit}>
      <div className="card-heading">
        <div><p className="eyebrow">CSV adapter</p><h2>Prepare an import</h2></div>
        <a className="button button-secondary" href="/api/admin/imports/template">Download template</a>
      </div>
      <p className="muted">Maximum {maxRows} rows and {Math.floor(maxBytes / 1_000)} KB. Preview, duplicate, and suppression checks happen before confirmation.</p>
      <label className="upload-zone">
        <UploadCloud />
        <strong>{file?.name || "Choose a CSV file"}</strong>
        <span>The file is not stored in browser local storage.</span>
        <input
          accept=".csv,text/csv"
          name="file-picker"
          type="file"
          onChange={(event) => void chooseFile(event.target.files?.[0])}
        />
      </label>
      {headers.length > 0 && (
        <>
          <fieldset className="mapping-grid">
            <legend>Map your columns</legend>
            {importFieldNames.map((field) => (
              <label key={field}>
                {labels[field]}{field === "businessName" ? " *" : ""}
                <select
                  value={mapping[field] || ""}
                  onChange={(event) =>
                    setMapping((current) => ({
                      ...current,
                      [field]: event.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Not mapped</option>
                  {headers.map((header) => <option key={header}>{header}</option>)}
                </select>
              </label>
            ))}
          </fieldset>
          <div className="admin-form">
            <label>Source name<input name="sourceName" required defaultValue={defaultSourceName} maxLength={120} /></label>
            <label>Source URL <span className="muted">(optional)</span><input name="sourceUrl" type="url" placeholder="https://" /></label>
          </div>
        </>
      )}
      {message && <p className="form-message form-error" role="alert">{message}</p>}
      <button className="button button-primary" disabled={!file || submitting} type="submit">
        {submitting ? "Validating…" : "Create import preview"}
      </button>
    </form>
  );
}
