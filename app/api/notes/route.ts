import { NextRequest, NextResponse } from "next/server";
import { searchNotes } from "@/lib/perfumes";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const offset = Number.parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10) || 0;
  return NextResponse.json(searchNotes(query, 20, offset));
}
