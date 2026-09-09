import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPerfumeDetail, getSimilarPerfumes } from "@/lib/perfumes";

export default async function PerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfumeId = Number.parseInt(id, 10);
  const perfume = Number.isFinite(perfumeId) ? getPerfumeDetail(perfumeId) : null;
  if (!perfume) notFound();

  const similar = getSimilarPerfumes(perfume.id);

  return (
    <main className="max-w-3xl mx-auto p-6 w-full flex flex-col gap-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline w-fit">
        <ArrowLeftIcon className="size-4" />
        Back to search
      </Link>

      <div>
        {perfume.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={perfume.imageUrl}
            alt={perfume.name}
            className="w-32 h-32 rounded-lg object-cover mb-4"
          />
        )}
        <h1 className="text-2xl font-semibold">{perfume.name}</h1>
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

      <Card>
        <CardHeader>
          <CardTitle>Accords</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {perfume.accords.map((a) => (
            <Badge key={a} variant="secondary" className="capitalize">
              {a}
            </Badge>
          ))}
        </CardContent>
      </Card>

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
      </div>

      <div>
        <h2 className="font-medium mb-2">Similar perfumes</h2>
        <div className="flex flex-col">
          {similar.map((s, i) => (
            <div key={s.id}>
              {i > 0 && <Separator />}
              <Link href={`/perfume/${s.id}`} className="flex items-center justify-between py-2 hover:underline">
                <span>{s.name}</span>
                <CardDescription>{s.brand}</CardDescription>
              </Link>
            </div>
          ))}
          {similar.length === 0 && <p className="text-muted-foreground py-2">No similar perfumes found.</p>}
        </div>
      </div>
    </main>
  );
}
