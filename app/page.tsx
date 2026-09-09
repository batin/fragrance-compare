"use client";

import { AsyncCombobox } from "@/components/async-combobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "cn";
import type { PerfumeSummary } from "@/lib/perfumes";
import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;
const MAX_SELECTION = 4;

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
      if (checked) return prev.length < MAX_SELECTION ? [...prev, id] : prev;
      return prev.filter((x) => x !== id);
    });
  }

  const hasFilters = Boolean(brand || note || accord);

  return (
    <main className="max-w-5xl mx-auto p-6 w-full flex flex-col gap-6 pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Find your next scent</h1>
        <p className="text-muted-foreground">
          Search {" "}
          <span className="font-medium text-foreground">24,000+</span> perfumes, compare notes side
          by side, and discover similar fragrances.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
            <SelectTrigger className="w-40">
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
          {hasFilters && (
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
              <XIcon />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((p) => (
          <Card
            key={p.id}
            className={cn(
              "relative gap-3 transition-shadow hover:shadow-md",
              selected.includes(p.id) && "ring-2 ring-primary",
            )}
          >
            <Checkbox
              checked={selected.includes(p.id)}
              onCheckedChange={(checked) => toggleSelected(p.id, checked === true)}
              disabled={!selected.includes(p.id) && selected.length >= MAX_SELECTION}
              className="absolute top-4 right-4 z-10 bg-background"
            />
            <Link href={`/perfume/${p.id}`} className="flex flex-col gap-3">
              <CardHeader className="flex-row items-center gap-3">
                <Avatar size="lg">
                  {p.imageUrl && <AvatarImage src={p.imageUrl} alt={p.name} />}
                  <AvatarFallback className="font-heading">
                    {(p.brand ?? p.name).slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 pr-8">
                  <CardTitle className="truncate">{p.name}</CardTitle>
                  <CardDescription>
                    {p.brand} {p.rating ? `· ★${p.rating.toFixed(1)}` : ""}
                  </CardDescription>
                </div>
              </CardHeader>
              {p.accords.length > 0 && (
                <CardContent className="flex flex-wrap gap-1">
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
      </div>

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

      {hasMore && results.length > 0 && (
        <div ref={sentinelRef} className="flex justify-center py-4 text-sm text-muted-foreground">
          {loading ? "Loading more..." : ""}
        </div>
      )}

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex items-center gap-3 px-6 py-3">
            <span className="text-sm">
              <span className="font-medium">{selected.length}</span> of {MAX_SELECTION} selected
            </span>
            <Button size="sm" render={<Link href={`/compare?ids=${selected.join(",")}`} />} nativeButton={false}>
              Compare
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
