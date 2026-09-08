"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PerfumeSummary } from "@/lib/perfumes";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PerfumeSummary[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/perfumes?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setResults)
      .catch(() => {});
    return () => controller.abort();
  }, [query]);

  function toggleSelected(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 w-full">
      <h1 className="text-2xl font-semibold mb-4">Parfume Compare</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by perfume or brand name..."
        className="w-full border rounded px-3 py-2 mb-4"
      />

      {selected.length > 0 && (
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span>{selected.length} selected</span>
          <Link
            href={`/compare?ids=${selected.join(",")}`}
            className="text-blue-600 underline"
          >
            Compare
          </Link>
          <button onClick={() => setSelected([])} className="text-gray-500 underline">
            Clear
          </button>
        </div>
      )}

      <ul className="divide-y">
        {results.map((p) => (
          <li key={p.id} className="py-3 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggleSelected(p.id)}
              disabled={!selected.includes(p.id) && selected.length >= 4}
            />
            <Link href={`/perfume/${p.id}`} className="flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500">
                {p.brand} {p.rating ? `· ★${p.rating.toFixed(1)}` : ""}
              </div>
              {p.accords.length > 0 && (
                <div className="text-xs text-gray-400">{p.accords.slice(0, 5).join(", ")}</div>
              )}
            </Link>
          </li>
        ))}
        {results.length === 0 && (
          <li className="py-6 text-center text-gray-500">No perfumes found.</li>
        )}
      </ul>
    </main>
  );
}
