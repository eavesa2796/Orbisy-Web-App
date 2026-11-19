"use client";
import { useState } from "react";
import { buildCampaignUrl, campaignDestinations } from "@/lib/analytics/measurement";
export function CampaignLinkBuilder() {
 const [path,setPath]=useState("/association-websites");
 const [source,setSource]=useState("google");const [medium,setMedium]=useState("cpc");
 const [campaign,setCampaign]=useState("");const [content,setContent]=useState("");
 const result=buildCampaignUrl(path,source,medium,campaign,content);
 return <section className="admin-card"><h2>Build a campaign link</h2><p>Use consistent labels so a saved inquiry can be grouped with the campaign that brought it in. This tool creates a link; it does not create ads, spend money, or connect accounts.</p>
 <div className="admin-form">
 <label>Landing page<select value={path} onChange={e=>setPath(e.target.value)}>{Object.entries(campaignDestinations).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
 <label>Source<input value={source} onChange={e=>setSource(e.target.value)} maxLength={64} placeholder="google" /></label>
 <label>Medium<input value={medium} onChange={e=>setMedium(e.target.value)} maxLength={64} placeholder="cpc" /></label>
 <label>Campaign<input value={campaign} onChange={e=>setCampaign(e.target.value)} maxLength={64} placeholder="association-websites-search" /></label>
 <label>Ad variant · optional<input value={content} onChange={e=>setContent(e.target.value)} maxLength={64} placeholder="website-ad-a" /></label>
 <p className="field-help span-two">Use lowercase letters, numbers, hyphens, or underscores. Required labels start with a letter or number. Use campaign names, never a visitor’s name, email, organization, or other personal details. Examples: google / cpc, facebook / paid_social, newsletter / email.</p>
 {result ? <><label className="span-two">Tagged URL<input readOnly value={result.url} onFocus={e=>e.target.select()} /></label><label className="span-two">Final URL suffix · for an ad platform that supports it<input readOnly value={result.suffix} onFocus={e=>e.target.select()} /></label><p className="field-help span-two">Choose the tagged URL or apply the suffix to the untagged landing-page URL. Avoid duplicate UTM parameters. Selecting an output field highlights it for copying.</p></> : <p role="status" className="notice span-two">Enter valid source, medium, and campaign labels to generate a link.</p>}
 </div></section>;
}
