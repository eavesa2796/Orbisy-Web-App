import {describe, expect, it} from "vitest";
import Page, {generateStaticParams} from "@/app/industries/[industry]/page";
import { industries } from "@/lib/industries";
describe("Retired industry URLs",()=>{
 it("preserves known URLs with a permanent destination at real work",async()=>{
 expect(generateStaticParams()).toHaveLength(industries.length);
 for (const {slug} of industries) await expect(Page({params: Promise.resolve({industry:slug})})).rejects.toMatchObject({digest: expect.stringContaining("/work;308")});
 });
 it("does not turn unknown URLs into valid pages",async()=>{
 await expect(Page({params:Promise.resolve({industry:'unknown'})})).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
 });
});
