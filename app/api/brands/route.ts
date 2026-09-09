import { NextRequest, NextResponse } from "next/server";
import { searchBrands } from "@/lib/perfumes";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(searchBrands(query));
}
