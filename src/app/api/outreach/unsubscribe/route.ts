import {getOutreachPreferences,postOutreachPreferences} from "@/lib/outreach/preferences";
export const GET=getOutreachPreferences;
export async function POST(request:Request){return postOutreachPreferences(request);}
