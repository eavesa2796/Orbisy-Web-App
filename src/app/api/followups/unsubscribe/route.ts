import {getPreferences, postPreferences} from "@/lib/followups/preferences";

// Existing signed links and provider one-click POST requests remain compatible.
export const GET = getPreferences;
export async function POST(request: Request) { return postPreferences(request); }
