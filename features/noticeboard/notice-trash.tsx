"use client";

import { TrashTabPattern } from "@/components/shared/trash-tab-pattern";

// Backend gap: GET /notice filters out deleted items and no endpoint lists them,
// so the trash tab is a structural placeholder until the backend adds one.
export function NoticeTrash() {
  return (
    <TrashTabPattern
      title="Trash"
      description="Deleted notices will appear here once the backend supports listing trashed items."
    />
  );
}
