"use client";

import { getSearchUser, type MailUser } from "@/services/mail.api";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UserSearchPickerProps = {
  value: MailUser[];
  onChange: (users: MailUser[]) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
};

const DEBOUNCE_MS = 300;

export function UserSearchPicker({
  value,
  onChange,
  label,
  placeholder = "Search users...",
  multiple = true,
  disabled = false,
}: UserSearchPickerProps) {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const blurRef = useRef<NodeJS.Timeout>(null);

  const { data: results = [] } = useQuery({
    queryKey: ["users", debouncedKeyword],
    queryFn: () => getSearchUser(debouncedKeyword),
    enabled: debouncedKeyword.trim().length >= 2,
  });

  // Hide already-selected users from the dropdown
  const selectable = results.filter(
    (user) => !value.some((selected) => selected.id === user.id),
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setKeyword(next);
    setHighlighted(0);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setDebouncedKeyword(next),
      DEBOUNCE_MS,
    );
  };

  const selectUser = (user: MailUser) => {
    onChange(multiple ? [...value, user] : [user]);
    setKeyword("");
    setDebouncedKeyword("");
    setOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const removeUser = (user: MailUser) => {
    onChange(value.filter((u) => u.id !== user.id));
  };

  // Single-select: show chosen user's name until the field is focused again
  const inputValue =
    keyword === "" && !multiple && value[0] ? value[0].name : keyword;

  const dropdownOpen =
    open && keyword.trim().length >= 2 && selectable.length > 0;

  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium">{label}</label>}

      {/* Selected chips */}
      {multiple && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm"
            >
              {user.name} ({user.email})
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeUser(user)}
                aria-label={`Remove ${user.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Input
        placeholder={placeholder}
        value={inputValue}
        disabled={disabled}
        autoComplete="off"
        onChange={handleInputChange}
        onFocus={() => {
          if (blurRef.current) clearTimeout(blurRef.current);
          if (!multiple) setKeyword("");
        }}
        onBlur={() => {
          if (blurRef.current) clearTimeout(blurRef.current);
          blurRef.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlighted((h) => Math.min(h + 1, selectable.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && dropdownOpen) {
            e.preventDefault();
            const user = selectable[highlighted];
            if (user) selectUser(user);
          }
        }}
      />

      {/* Search results */}
      {dropdownOpen && (
        <div className="border mt-2 rounded-md max-h-40 overflow-auto">
          {selectable.map((user, i) => (
            <div
              key={user.id}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-muted",
                i === highlighted && "bg-muted",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectUser(user)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {user.name} — {user.email}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
