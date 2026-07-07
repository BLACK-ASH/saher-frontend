"use client";

import { Table } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { HolidayT } from "@/services/holiday.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HolidayToolbarProps = {
  table: Table<HolidayT>;
  onCreate: () => void;
};

export function HolidayToolbar({ table, onCreate }: HolidayToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2 md:flex-row">
        <Input
          placeholder="Search holidays..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("title")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        <Select
          value={(table.getColumn("type")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table
              .getColumn("type")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-55">
            <SelectValue placeholder="Filter Type" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="national">National</SelectItem>
            <SelectItem value="organizational">Organizational</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="public-holiday">Public Holiday</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Add Holiday
      </Button>
    </div>
  );
}
