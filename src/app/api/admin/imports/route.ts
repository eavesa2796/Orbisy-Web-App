import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminIdentity } from "@/lib/auth";
import { createCsvImport, getImportSettings } from "@/lib/imports/service";
import { importFieldNames } from "@/lib/imports/types";

export const runtime = "nodejs";

const mappingSchema = z
  .record(z.enum(importFieldNames), z.string().trim().min(1).max(200))
  .refine((mapping) => Boolean(mapping.businessName), {
    message: "Business name must be mapped.",
  });

export async function POST(request: Request) {
  const admin = await getAdminIdentity();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  const settings = await getImportSettings();
  if (contentLength > settings.maxCsvBytes + 100_000) {
    return NextResponse.json({ message: "CSV upload is too large." }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Select a CSV file." }, { status: 400 });
    }
    const safeName = file.name.replace(/[^\w.\- ]/g, "_").slice(0, 255);
    if (!safeName.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ message: "Only .csv files are accepted." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > settings.maxCsvBytes) {
      return NextResponse.json(
        { message: `CSV must be smaller than ${Math.floor(settings.maxCsvBytes / 1_000)} KB.` },
        { status: 413 },
      );
    }
    const allowedTypes = ["", "text/csv", "application/csv", "application/vnd.ms-excel"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Unsupported CSV content type." }, { status: 400 });
    }

    const mapping = mappingSchema.parse(
      JSON.parse(String(formData.get("mapping") || "{}")),
    );
    const sourceName = z
      .string()
      .trim()
      .min(1)
      .max(120)
      .parse(formData.get("sourceName"));
    const sourceUrl = z
      .union([z.literal(""), z.url().max(500)])
      .parse(String(formData.get("sourceUrl") || ""));
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length > settings.maxCsvBytes || bytes.includes(0)) {
      return NextResponse.json({ message: "Unsupported or oversized CSV." }, { status: 400 });
    }
    const csvText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const batchId = await createCsvImport({
      filename: safeName,
      csvText,
      mapping,
      sourceName,
      sourceUrl: sourceUrl || undefined,
      administratorEmail: admin.email,
    });
    return NextResponse.json({ batchId }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message
        : error instanceof Error
          ? error.message
          : "Import could not be prepared.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
