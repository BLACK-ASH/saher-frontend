"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NoData } from "@/components/no-data";

type TrashTabPatternProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

// Reusable Active/Trash tab content wrapper (D-12/D-13). Modules without a
// trash-list endpoint get the NoData placeholder; pass children once one exists.
export function TrashTabPattern({
  title,
  description,
  children,
}: TrashTabPatternProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children ? (
          <>
            <p className="text-muted-foreground text-sm">{description}</p>
            {children}
          </>
        ) : (
          <NoData title={title} description={description} />
        )}
      </CardContent>
    </Card>
  );
}
