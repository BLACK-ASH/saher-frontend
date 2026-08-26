"use client";

import { NoData } from "@/components/no-data";

// Backend gap: GET /notice filters out deleted items and no endpoint lists them,
// so the trash tab is a structural placeholder until the backend adds one.
export function NoticeTrash() {
  return (
    <div className="p-4">
      <NoData
        title="Trash"
        description="Deleted notices will appear here once the backend supports listing trashed items."
      />
    </div>
  );
}
