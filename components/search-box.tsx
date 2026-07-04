"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SearchBoxProps = {
  queryName?: string;
  placeholder?: string;
  debounce?: number;
};

export function SearchBox({
  queryName = "keyword",
  placeholder = "Search...",
  debounce = 300,
}: SearchBoxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(searchParams.get(queryName) ?? "");

  // Keep input in sync when the URL changes (e.g. back/forward navigation)
  useEffect(() => {
    setValue(searchParams.get(queryName) ?? "");
  }, [searchParams, queryName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set(queryName, value);
      } else {
        params.delete(queryName);
      }

      // Optional: reset page on new search
      params.delete("page");

      router.replace(`${pathname}?${params.toString()}`, {
        scroll: false,
      });
    }, debounce);

    return () => clearTimeout(timer);
  }, [value, debounce, pathname, queryName, router, searchParams]);

  return (
    <Input
      value={value}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
