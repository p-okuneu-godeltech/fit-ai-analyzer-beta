import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { deleteSessionForUser, getSessionDetailById } from "@/db/queries/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string | string[] }> },
) {
  const user = await requireUser();

  const { id: rawId } = await params;
  const idString = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number.parseInt(idString, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return new NextResponse("Invalid session id", { status: 400 });
  }

  const session = getSessionDetailById(user.id, id);

  if (!session) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json(session);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string | string[] }> },
) {
  const user = await requireUser();

  const { id: rawId } = await params;
  const idString = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number.parseInt(idString, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return new NextResponse("Invalid session id", { status: 400 });
  }

  const deleted = deleteSessionForUser(user.id, id);

  if (!deleted) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
