import { NextRequest, NextResponse } from "next/server";
import { searchPerfumes } from "@/lib/perfumes";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = searchPerfumes(query);
  return NextResponse.json(results);
}
