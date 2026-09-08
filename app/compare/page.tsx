import Link from "next/link";
import { getPerfumeDetail, type PerfumeDetail } from "@/lib/perfumes";

function countIn(others: PerfumeDetail[], key: "notes" | "accords") {
  return (item: string) =>
    others.filter((o) => (key === "accords" ? o.accords : Object.values(o.notes).flat()).includes(item)).length;
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
        <p>
          No perfumes selected.{" "}
          <Link href="/" className="text-blue-600 underline">
            Go pick some to compare
          </Link>
          .
        </p>
      </main>
    );
  }

  const allAccords = Array.from(new Set(perfumes.flatMap((p) => p.accords))).sort();
  const allNotes = Array.from(new Set(perfumes.flatMap((p) => Object.values(p.notes).flat()))).sort();

  return (
    <main className="max-w-5xl mx-auto p-6 w-full overflow-x-auto">
      <Link href="/" className="text-sm text-blue-600 underline">
        ← Back to search
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-4">Compare</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 border-b"></th>
            {perfumes.map((p) => (
              <th key={p.id} className="text-left p-2 border-b">
                <Link href={`/perfume/${p.id}`} className="hover:underline">
                  {p.name}
                </Link>
                <div className="text-xs text-gray-500 font-normal">{p.brand}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 font-medium align-top">Accords</td>
            {perfumes.map((p) => (
              <td key={p.id} className="p-2 align-top">
                {allAccords
                  .filter((a) => p.accords.includes(a))
                  .map((a) => (
                    <span
                      key={a}
                      className={`inline-block text-xs rounded-full px-2 py-1 mr-1 mb-1 ${
                        countIn(perfumes, "accords")(a) > 1
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {a}
                    </span>
                  ))}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-2 font-medium align-top">Notes</td>
            {perfumes.map((p) => {
              const notes = Object.values(p.notes).flat();
              return (
                <td key={p.id} className="p-2 align-top">
                  {allNotes
                    .filter((n) => notes.includes(n))
                    .map((n) => (
                      <span
                        key={n}
                        className={`inline-block text-xs rounded-full px-2 py-1 mr-1 mb-1 ${
                          countIn(perfumes, "notes")(n) > 1
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-3">Green = shared with at least one other selected perfume.</p>
    </main>
  );
}
