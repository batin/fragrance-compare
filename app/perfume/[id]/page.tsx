import Link from "next/link";
import { notFound } from "next/navigation";
import { getPerfumeDetail, getSimilarPerfumes } from "@/lib/perfumes";

export default async function PerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfumeId = Number.parseInt(id, 10);
  const perfume = Number.isFinite(perfumeId) ? getPerfumeDetail(perfumeId) : null;
  if (!perfume) notFound();

  const similar = getSimilarPerfumes(perfume.id);

  return (
    <main className="max-w-3xl mx-auto p-6 w-full">
      <Link href="/" className="text-sm text-blue-600 underline">
        ← Back to search
      </Link>

      <h1 className="text-2xl font-semibold mt-2">{perfume.name}</h1>
      <p className="text-gray-500">
        {perfume.brand} {perfume.releaseYear ? `· ${perfume.releaseYear}` : ""}{" "}
        {perfume.rating ? `· ★${perfume.rating.toFixed(1)}` : ""}
      </p>
      {perfume.perfumers.length > 0 && (
        <p className="text-sm text-gray-500">Perfumer(s): {perfume.perfumers.join(", ")}</p>
      )}

      <section className="mt-6">
        <h2 className="font-medium mb-2">Accords</h2>
        <div className="flex flex-wrap gap-2">
          {perfume.accords.map((a) => (
            <span key={a} className="text-xs bg-gray-100 rounded-full px-3 py-1">
              {a}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["top", "middle", "base"] as const).map((position) => (
          <div key={position}>
            <h3 className="font-medium capitalize mb-1">{position} notes</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {perfume.notes[position].map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        ))}
        {perfume.notes.unspecified.length > 0 && (
          <div>
            <h3 className="font-medium mb-1">Notes</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {perfume.notes.unspecified.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-medium mb-2">Similar perfumes</h2>
        <ul className="divide-y">
          {similar.map((s) => (
            <li key={s.id} className="py-2">
              <Link href={`/perfume/${s.id}`} className="hover:underline">
                {s.name}
              </Link>
              <span className="text-sm text-gray-500"> — {s.brand}</span>
            </li>
          ))}
          {similar.length === 0 && (
            <li className="py-2 text-gray-500">No similar perfumes found.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
