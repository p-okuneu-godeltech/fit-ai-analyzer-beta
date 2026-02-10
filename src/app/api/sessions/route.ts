import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getSessionsByUserId } from "@/db/queries/session";

export async function GET() {
  const user = await requireUser();
  const sessions = getSessionsByUserId(user.id);

  return NextResponse.json({ sessions });
}
