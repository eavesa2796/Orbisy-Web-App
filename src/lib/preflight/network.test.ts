// @vitest-environment node
import { describe, expect, it } from "vitest";
import { classifyAddress, parsePublicHttpUrl, resolvePublicAddresses } from "./network";
describe("preflight URL validation", () => {
  it.each(["http://example.com", "https://example.com/path"])("accepts %s", value => expect(parsePublicHttpUrl(value).hostname).toBe("example.com"));
  it.each([["ftp://example.com","unsupported_scheme"],["https://a:b@example.com","embedded_credentials"],["https://localhost","prohibited_hostname"],["http://2130706433","prohibited_address"]])("rejects %s", async (value, code) => { if(code==="prohibited_address") await expect(resolvePublicAddresses(parsePublicHttpUrl(value).hostname)).rejects.toThrow(code); else expect(()=>parsePublicHttpUrl(value)).toThrow(code); });
});
describe("SSRF address policy", () => {
  it.each(["127.0.0.1","0.0.0.0","10.0.0.1","172.16.0.1","192.168.1.1","169.254.169.254","100.64.0.1","224.0.0.1","192.0.2.1","::1","::","fe80::1","fc00::1","ff02::1","::ffff:127.0.0.1"])("blocks %s", value => expect(classifyAddress(value)).toBe("prohibited"));
  it.each(["1.1.1.1","8.8.8.8","2606:4700:4700::1111"])("permits %s", value => expect(classifyAddress(value)).toBe("public"));
  it("rejects mixed DNS answers", async () => await expect(resolvePublicAddresses("example.test", async()=>[{address:"1.1.1.1",family:4},{address:"127.0.0.1",family:4}])).rejects.toThrow("prohibited_address"));
});
