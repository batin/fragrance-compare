import { ArrowLeftIcon } from "lucide-react";
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

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {perfume.imageUrl && <AvatarImage src={perfume.imageUrl} alt={perfume.name} />}
          <AvatarFallback className="font-heading text-xl">
            {(perfume.brand ?? perfume.name).slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{perfume.name}</h1>
          <p className="text-muted-foreground">
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

      <section className="flex flex-col gap-3">
        <h2 className="font-heading font-medium">Accords</h2>
        <div className="flex flex-wrap gap-2">
          {perfume.accords.map((a) => (
            <Badge key={a} variant="secondary" className="capitalize">
              {a}
            </Badge>
          ))}
          {perfume.accords.length === 0 && <p className="text-sm text-muted-foreground">No accords listed.</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <CardTitle>Notes</CardTitle>
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
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading font-medium">Similar perfumes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {similar.map((s) => (
            <Link key={s.id} href={`/perfume/${s.id}`}>
              <Card className="flex-row items-center gap-3 py-3 px-4 transition-shadow hover:shadow-md">
                <Avatar>
                  <AvatarFallback className="font-heading">
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
