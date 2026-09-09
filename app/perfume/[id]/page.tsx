import { ArrowLeftIcon, DropletsIcon, LayersIcon, SparklesIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="relative flex items-center gap-5">
          <Avatar className="size-20 shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
            {perfume.imageUrl && <AvatarImage src={perfume.imageUrl} alt={perfume.name} />}
            <AvatarFallback className="font-heading text-2xl bg-gradient-to-br from-primary/25 to-primary/5">
              {(perfume.brand ?? perfume.name).slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
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

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-heading font-medium text-lg">
          <LayersIcon className="size-5 text-primary" />
          Note pyramid
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["top", "middle", "base"] as const).map((position) => (
            <Card key={position}>
              <CardHeader>
                <CardTitle className="capitalize">{position} notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground capitalize flex flex-col gap-1">
                  {perfume.notes[position].map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                  {perfume.notes[position].length === 0 && <li className="italic">—</li>}
                </ul>
              </CardContent>
            </Card>
          ))}
          {perfume.notes.unspecified.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <DropletsIcon className="size-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground capitalize flex flex-col gap-1">
                  {perfume.notes.unspecified.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
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
              <Card className="flex-row items-center gap-3 py-3 px-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <Avatar>
                  <AvatarFallback className="font-heading bg-gradient-to-br from-primary/25 to-primary/5">
                    {(s.brand ?? s.name).slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
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
