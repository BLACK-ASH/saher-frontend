"use client";

import { useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";

export function AttendanceReportDropdown() {
  const [openLastDays, setOpenLastDays] = useState(false);
  const [openCustom, setOpenCustom] = useState(false);

  const [days, setDays] = useState(7);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<"pdf" | "xlsx">("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (
    query: Record<string, string | number | boolean>,
  ) => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      params.set(key, String(value));
    });

    const res = await apiFetch(
      `/api/attendance/export/report?${params.toString()}`,
      {
        method: "GET",
      },
    );
    if (!res.success) toast.error(res.message);
    toast.success(res.message);
  };

  const handleGenerate = async (query: Record<string, string | number | boolean>) => {
    setIsGenerating(true);
    try {
      await generateReport({ ...query, format });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <p className="hidden md:block">
              Export Report ({format.toUpperCase()})
            </p>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setFormat("pdf")}>
            {format === "pdf" && <Check className="mr-2 h-4 w-4" />}
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setFormat("xlsx")}>
            {format === "xlsx" && <Check className="mr-2 h-4 w-4" />}
            Excel (XLSX)
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => handleGenerate({ type: "today" })}>
            Today
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              handleGenerate({
                type: "week",
                includeToday: true,
              })
            }
          >
            Week
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              handleGenerate({
                type: "month",
                includeToday: true,
              })
            }
          >
            Month
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              handleGenerate({
                type: "year",
                includeToday: true,
              })
            }
          >
            Year
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenLastDays(true)}>
            Last N Days
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenCustom(true)}>
            Custom Range
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openLastDays} onOpenChange={setOpenLastDays}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Last N Days Report</DialogTitle>
          </DialogHeader>

          <Input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />

          <Button
            onClick={async () => {
              await handleGenerate({
                type: "lastDays",
                days,
                includeToday: true,
              });

              setOpenLastDays(false);
            }}
          >
            Generate
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={openCustom} onOpenChange={setOpenCustom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Report</DialogTitle>
          </DialogHeader>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <Button
            onClick={async () => {
              await handleGenerate({
                type: "custom",
                startDate,
                endDate,
              });

              setOpenCustom(false);
            }}
          >
            Generate
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
