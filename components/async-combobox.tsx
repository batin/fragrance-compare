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

/** A combobox whose options come from a server endpoint (`GET endpoint?q=`), for large option sets. */
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

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`${endpoint}?q=${encodeURIComponent(inputValue)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then(setItems)
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [inputValue, endpoint]);

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
        <ComboboxList>
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
