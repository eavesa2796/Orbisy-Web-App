import {getPreferences, postPreferences} from "@/lib/followups/preferences";

export const GET = getPreferences;
export async function POST(request: Request) { return postPreferences(request, true); }
