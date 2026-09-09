import { NextRequest, NextResponse } from "next/server";
import { searchPerfumes } from "@/lib/perfumes";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q") ?? "";
  const offset = Number.parseInt(params.get("offset") ?? "0", 10) || 0;
  const results = searchPerfumes(query, PAGE_SIZE, offset, {
    brand: params.get("brand") ?? undefined,
    note: params.get("note") ?? undefined,
    accord: params.get("accord") ?? undefined,
  });
  return NextResponse.json(results);
}
