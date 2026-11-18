import { NextResponse } from "next/server";

// Retired collector. Old open tabs may still POST; acknowledge without parsing,
// rate-limit writes, event insertion, or retention deletion. Historical rows stay intact.
export async function POST() {
  return new NextResponse(null, {status:204,headers:{"Cache-Control":"no-store"}});
}
