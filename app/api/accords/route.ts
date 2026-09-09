import { NextResponse } from "next/server";
import { getAllAccordNames } from "@/lib/perfumes";

export async function GET() {
  return NextResponse.json(getAllAccordNames());
}
