"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const searchParams = useSearchParams();

  const [value, setValue] = useState(() => searchParams.get(queryName) ?? "");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input if URL changes externally
  useEffect(() => {
    // ponytail: intentional external-URL → input sync; derive-state refactor
    // would fight the debounce write-back
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(searchParams.get(queryName) ?? "");
  }, [searchParams, queryName]);

  // Cancel pending debounce when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (value: string) => {
    setValue(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);

      if (value.trim()) {
        params.set(queryName, value);
      } else {
        params.delete(queryName);
      }

      // Reset pagination on new search
      params.delete("page");

      const query = params.toString();

      router.replace(
        query
          ? `${window.location.pathname}?${query}`
          : window.location.pathname,
        {
          scroll: false,
        },
      );
    }, debounce);
  };

  return (
    <Input
      value={value}
      placeholder={placeholder}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
