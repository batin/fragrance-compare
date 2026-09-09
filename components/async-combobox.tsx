"use client";

import { useEffect, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const PAGE_SIZE = 20;

/**
 * A combobox whose options come from a server endpoint (`GET endpoint?q=&offset=`),
 * for option sets too large to fetch all at once. Loads more as the list is scrolled.
 */
export function AsyncCombobox({
  endpoint,
  value,
  onValueChange,
  placeholder,
}: {
  endpoint: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState(value ?? "");
  const [items, setItems] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`${endpoint}?q=${encodeURIComponent(inputValue)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: string[]) => {
          setItems(data);
          setHasMore(data.length === PAGE_SIZE);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [inputValue, endpoint]);

  function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetch(`${endpoint}?q=${encodeURIComponent(inputValue)}&offset=${items.length}`)
      .then((res) => res.json())
      .then((data: string[]) => {
        setItems((prev) => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMore();
  }

  return (
    <Combobox
      items={items}
      filter={null}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      value={value}
      onValueChange={(v) => onValueChange((v as string) || null)}
    >
      <ComboboxInput placeholder={placeholder} showClear />
      <ComboboxContent>
        <ComboboxEmpty>No results</ComboboxEmpty>
        <ComboboxList onScroll={handleScroll}>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
