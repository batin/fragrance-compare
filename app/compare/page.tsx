import { ArrowLeftIcon, InfoIcon, ScaleIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPerfumeDetail, type PerfumeDetail } from "@/lib/perfumes";

function countIn(others: PerfumeDetail[], key: "notes" | "accords") {
  return (item: string) =>
    others.filter((o) => (key === "accords" ? o.accords : Object.values(o.notes).flat()).includes(item)).length;
}

function ChipRow({
  label,
  perfumes,
  allValues,
  valuesFor,
  countKey,
}: {
  label: string;
  perfumes: PerfumeDetail[];
  allValues: string[];
  valuesFor: (p: PerfumeDetail) => string[];
  countKey: "notes" | "accords";
}) {
  return (
    <TableRow>
      <TableCell className="font-medium align-top text-muted-foreground">{label}</TableCell>
      {perfumes.map((p) => {
        const values = allValues.filter((v) => valuesFor(p).includes(v));
        return (
          <TableCell key={p.id} className="align-top whitespace-normal">
            {values.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {values.map((v) => (
                  <Badge
                    key={v}
                    variant={countIn(perfumes, countKey)(v) > 1 ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            )}
          </TableCell>
        );
      })}
    </TableRow>
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

  const allAccords = Array.from(new Set(perfumes.flatMap((p) => p.accords))).sort();
  const noteRows: Array<{ label: string; key: "top" | "middle" | "base" }> = [
    { label: "Top notes", key: "top" },
    { label: "Middle notes", key: "middle" },
    { label: "Base notes", key: "base" },
  ];
  const allNotesByPosition = Object.fromEntries(
    noteRows.map(({ key }) => [key, Array.from(new Set(perfumes.flatMap((p) => p.notes[key]))).sort()]),
  ) as Record<"top" | "middle" | "base", string[]>;

  return (
    <main className="max-w-5xl mx-auto p-6 w-full flex flex-col gap-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline w-fit">
        <ArrowLeftIcon className="size-4" />
        Back to search
      </Link>
      <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
        <ScaleIcon className="size-7 text-primary" />
        Compare
      </h1>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-muted/30"></TableHead>
              {perfumes.map((p) => (
                <TableHead key={p.id} className="whitespace-normal align-top bg-muted/30 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                      {p.imageUrl && <AvatarImage src={p.imageUrl} alt={p.name} />}
                      <AvatarFallback className="font-heading bg-gradient-to-br from-primary/25 to-primary/5">
                        {(p.brand ?? p.name).slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/perfume/${p.id}`} className="hover:underline font-medium">
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted-foreground font-normal">
                        {p.brand}
                        {p.releaseYear ? ` · ${p.releaseYear}` : ""}
                        {p.rating ? ` · ★${p.rating.toFixed(1)}` : ""}
                      </div>
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <ChipRow
              label="Accords"
              perfumes={perfumes}
              allValues={allAccords}
              valuesFor={(p) => p.accords}
              countKey="accords"
            />
            {noteRows.map(({ label, key }) => (
              <ChipRow
                key={key}
                label={label}
                perfumes={perfumes}
                allValues={allNotesByPosition[key]}
                valuesFor={(p) => p.notes[key]}
                countKey="notes"
              />
            ))}
          </TableBody>
        </Table>
      </Card>

      <Alert>
        <InfoIcon />
        <AlertDescription>Highlighted chips are shared with at least one other selected perfume.</AlertDescription>
      </Alert>
    </main>
  );
}
