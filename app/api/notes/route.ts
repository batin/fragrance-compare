import { NextRequest, NextResponse } from "next/server";
import { searchNotes } from "@/lib/perfumes";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(searchNotes(query));
}
