import { ArrowLeftIcon, InfoIcon, ScaleIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getPerfumeDetail, type PerfumeDetail } from "@/lib/perfumes";

function countIn(others: PerfumeDetail[], key: "notes" | "accords") {
  return (item: string) =>
    others.filter((o) => (key === "accords" ? o.accords : Object.values(o.notes).flat()).includes(item)).length;
}

function ChipGroup({ label, values, isShared }: { label: string; values: string[]; isShared: (v: string) => boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {values.length === 0 ? (
        <span className="text-sm text-muted-foreground">—</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => (
            <Badge key={v} variant={isShared(v) ? "default" : "secondary"} className="capitalize">
              {v}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const perfumeIds = (ids ?? "")
    .split(",")
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n));

  const perfumes = perfumeIds
    .map((id) => getPerfumeDetail(id))
    .filter((p): p is PerfumeDetail => p !== null);

  if (perfumes.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-6 w-full">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No perfumes selected</EmptyTitle>
            <EmptyDescription>
              <Link href="/" className="text-primary hover:underline">
                Go pick some to compare
              </Link>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  const noteRows: Array<{ label: string; key: "top" | "middle" | "base" }> = [
    { label: "Top notes", key: "top" },
    { label: "Middle notes", key: "middle" },
    { label: "Base notes", key: "base" },
  ];
  const isAccordShared = (v: string) => countIn(perfumes, "accords")(v) > 1;
  const isNoteShared = (v: string) => countIn(perfumes, "notes")(v) > 1;

  return (
    <main className="max-w-6xl mx-auto p-6 w-full flex flex-col gap-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline w-fit">
        <ArrowLeftIcon className="size-4" />
        Back to search
      </Link>
      <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
        <ScaleIcon className="size-7 text-primary" />
        Compare
      </h1>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {perfumes.map((p) => (
          <Card key={p.id} className="min-w-72 flex-1 shrink-0">
            <CardHeader className="flex-row items-center gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-muted to-muted/50">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="absolute inset-0 size-full object-contain p-2" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-heading text-xl text-primary/40">
                    {(p.brand ?? p.name).slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <Link href={`/perfume/${p.id}`} className="hover:underline">
                  <CardTitle className="truncate">{p.name}</CardTitle>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {p.brand}
                  {p.releaseYear ? ` · ${p.releaseYear}` : ""}
                  {p.rating ? ` · ★${p.rating.toFixed(1)}` : ""}
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ChipGroup label="Accords" values={p.accords} isShared={isAccordShared} />
              {noteRows.map(({ label, key }) => (
                <ChipGroup key={key} label={label} values={p.notes[key]} isShared={isNoteShared} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <InfoIcon />
        <AlertDescription>Highlighted chips are shared with at least one other selected perfume.</AlertDescription>
      </Alert>
    </main>
  );
}
