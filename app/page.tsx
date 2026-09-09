"use client";

import { AsyncCombobox } from "@/components/async-combobox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "cn";
import type { PerfumeSummary } from "@/lib/perfumes";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

export default function Home() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [accord, setAccord] = useState<string | null>(null);
  const [accordOptions, setAccordOptions] = useState<string[]>([]);

  const [results, setResults] = useState<PerfumeSummary[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch("/api/accords")
      .then((res) => res.json())
      .then(setAccordOptions)
      .catch(() => {});
  }, []);

  function filterParams(offset: number) {
    const params = new URLSearchParams({ q: query, offset: String(offset) });
    if (brand) params.set("brand", brand);
    if (note) params.set("note", note);
    if (accord) params.set("accord", accord);
    return params;
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/perfumes?${filterParams(0)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: PerfumeSummary[]) => {
        setResults(data);
        setHasMore(data.length === PAGE_SIZE);
        setSearched(true);
      })
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, brand, note, accord]);

  function loadMore() {
    setLoading(true);
    fetch(`/api/perfumes?${filterParams(results.length)}`)
      .then((res) => res.json())
      .then((data: PerfumeSummary[]) => {
        setResults((prev) => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length, hasMore, loading, query, brand, note, accord]);

  function toggleSelected(id: number, checked: boolean) {
    setSelected((prev) => {
      if (checked) return prev.length < 4 ? [...prev, id] : prev;
      return prev.filter((x) => x !== id);
    });
  }

  return (
    <main className="max-w-4xl mx-auto p-6 w-full flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Parfume Compare</h1>

      <div className="relative">
        <SearchIcon
          data-icon="inline-start"
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search perfumes or brands..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AsyncCombobox endpoint="/api/brands" value={brand} onValueChange={setBrand} placeholder="Brand" />
        <AsyncCombobox endpoint="/api/notes" value={note} onValueChange={setNote} placeholder="Note" />
        <Select value={accord ?? ""} onValueChange={(v) => setAccord(v || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Accord" className="capitalize" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {accordOptions.map((a) => (
              <SelectItem key={a} value={a} className="capitalize">
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(brand || note || accord) && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setBrand(null);
              setNote(null);
              setAccord(null);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span>{selected.length} selected</span>
          <Button
            size="sm"
            render={<Link href={`/compare?ids=${selected.join(",")}`} />}
            nativeButton={false}
          >
            Compare
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {results.map((p) => (
          <Card
            key={p.id}
            size="sm"
            className={cn(
              "flex-row items-center gap-3 py-3 px-4 transition-shadow hover:shadow-sm",
              selected.includes(p.id) && "ring-2 ring-primary",
            )}
          >
            <Checkbox
              checked={selected.includes(p.id)}
              onCheckedChange={(checked) => toggleSelected(p.id, checked === true)}
              disabled={!selected.includes(p.id) && selected.length >= 4}
            />
            {p.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="size-12 rounded-md object-cover shrink-0" />
            )}
            <Link href={`/perfume/${p.id}`} className="flex-1 min-w-0">
              <CardHeader className="p-0">
                <CardTitle className="truncate">{p.name}</CardTitle>
                <CardDescription>
                  {p.brand} {p.rating ? `· ★${p.rating.toFixed(1)}` : ""}
                </CardDescription>
              </CardHeader>
              {p.accords.length > 0 && (
                <CardContent className="p-0 mt-2 flex flex-wrap gap-1">
                  {p.accords.slice(0, 5).map((a) => (
                    <Badge key={a} variant="secondary" className="capitalize">
                      {a}
                    </Badge>
                  ))}
                </CardContent>
              )}
            </Link>
          </Card>
        ))}

        {results.length === 0 && searched && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No perfumes found</EmptyTitle>
              <EmptyDescription>Try a different name, brand, or filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      {hasMore && results.length > 0 && (
        <div ref={sentinelRef} className="flex justify-center py-4 text-sm text-muted-foreground">
          {loading ? "Loading more..." : ""}
        </div>
      )}
    </main>
  );
}
