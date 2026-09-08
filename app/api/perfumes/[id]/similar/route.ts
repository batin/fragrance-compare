import { NextResponse } from "next/server";
import { getSimilarPerfumes } from "@/lib/perfumes";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfumeId = Number.parseInt(id, 10);
  if (!Number.isFinite(perfumeId)) {
    return NextResponse.json({ error: "Invalid perfume id" }, { status: 400 });
  }
  return NextResponse.json(getSimilarPerfumes(perfumeId));
}
