import { ArrowLeftIcon, DropletsIcon, LayersIcon, SparklesIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getPerfumeDetail, getSimilarPerfumes } from "@/lib/perfumes";

export default async function PerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfumeId = Number.parseInt(id, 10);
  const perfume = Number.isFinite(perfumeId) ? getPerfumeDetail(perfumeId) : null;
  if (!perfume) notFound();

  const similar = getSimilarPerfumes(perfume.id);

  return (
    <main className="max-w-3xl mx-auto p-6 w-full flex flex-col gap-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline w-fit">
        <ArrowLeftIcon className="size-4" />
        Back to search
      </Link>

      <div className="relative overflow-hidden rounded-3xl border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-40 aspect-[4/5] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50">
            {perfume.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={perfume.imageUrl}
                alt={perfume.name}
                className="absolute inset-0 size-full object-contain p-4"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-heading text-5xl text-primary/40">
                {(perfume.brand ?? perfume.name).slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-semibold tracking-tight">{perfume.name}</h1>
            <p className="text-muted-foreground text-base">
              {perfume.brand} {perfume.releaseYear ? `· ${perfume.releaseYear}` : ""}{" "}
              {perfume.rating ? `· ★${perfume.rating.toFixed(1)}` : ""}
            </p>
            {perfume.perfumers.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Perfumer(s): <span className="capitalize">{perfume.perfumers.join(", ")}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-heading font-medium text-lg">
          <SparklesIcon className="size-5 text-primary" />
          Accords
        </h2>
        <div className="flex flex-wrap gap-2">
          {perfume.accords.map((a, i) => (
            <Badge key={a} variant={i === 0 ? "default" : "secondary"} className="capitalize">
              {a}
            </Badge>
          ))}
          {perfume.accords.length === 0 && <p className="text-sm text-muted-foreground">No accords listed.</p>}
        </div>
      </section>

      <section className="flex flex-col gap-4 items-center">
        <h2 className="self-start flex items-center gap-2 font-heading font-medium text-lg">
          <LayersIcon className="size-5 text-primary" />
          Note pyramid
        </h2>
        <div className="flex flex-col items-center gap-3 w-full">
          {(
            [
              { position: "top" as const, width: "max-w-xs", tint: "bg-primary/5" },
              { position: "middle" as const, width: "max-w-md", tint: "bg-primary/10" },
              { position: "base" as const, width: "max-w-2xl", tint: "bg-primary/15" },
            ]
          ).map(({ position, width, tint }) => (
            <div key={position} className={`w-full ${width} rounded-2xl border ${tint} px-6 py-4 text-center`}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {position} notes
              </p>
              {perfume.notes[position].length === 0 ? (
                <p className="text-sm text-muted-foreground italic">—</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {perfume.notes[position].map((n) => (
                    <Badge key={n} variant="secondary" className="capitalize">
                      {n}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          {perfume.notes.unspecified.length > 0 && (
            <div className="w-full max-w-2xl rounded-2xl border px-6 py-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                <DropletsIcon className="size-3.5" />
                Notes
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {perfume.notes.unspecified.map((n) => (
                  <Badge key={n} variant="secondary" className="capitalize">
                    {n}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-heading font-medium text-lg">
          <UsersIcon className="size-5 text-primary" />
          Similar perfumes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {similar.map((s) => (
            <Link key={s.id} href={`/perfume/${s.id}`}>
              <Card className="flex-row items-center gap-3 py-2 pr-4 pl-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-muted to-muted/50">
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt={s.name} className="absolute inset-0 size-full object-contain p-1.5" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center font-heading text-lg text-primary/40">
                      {(s.brand ?? s.name).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <CardDescription>{s.brand}</CardDescription>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        {similar.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No similar perfumes found</EmptyTitle>
              <EmptyDescription>This one doesn&apos;t share enough notes or accords with others yet.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </main>
  );
}
