"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { useHoliday } from "@/hooks/use-holiday";
import { holidayTypes, HolidayT } from "@/services/holiday.api";

import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

export const holidaySchema = z.object({
  title: z.string().min(2, "Holiday Title Is Required."),
  type: z.enum(holidayTypes),
  date: z.string(),
  description: z.string().optional(),
});
type HolidayFormValues = z.infer<typeof holidaySchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday?: HolidayT | null;
};

export function HolidayFormDialog({ open, onOpenChange, holiday }: Props) {
  const { createHoliday, editHoliday } = useHoliday();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      title: "",
      type: "other",
      date: "",
      description: "",
    },
  });

  useEffect(() => {
    if (holiday) {
      reset({
        title: holiday.title,
        type: holiday.type,
        date: new Date(holiday.date).toLocaleDateString(),
        description: holiday.description ?? "",
      });
    } else {
      reset({
        title: "",
        type: "other",
        date: "",
        description: "",
      });
    }
  }, [holiday, reset]);

  const onSubmit = (values: HolidayFormValues) => {
    if (holiday) {
      editHoliday.mutate(
        {
          id: holiday.id,
          data: values,
        },
        {
          onSuccess: () => onOpenChange(false),
        },
      );

      return;
    }

    createHoliday.mutate(values, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const isPending = createHoliday.isPending || editHoliday.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {holiday ? "Update Holiday" : "Create Holiday"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Holiday Title</Label>

                <Input placeholder="Enter holiday title" {...field} />

                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Type */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Holiday Type</Label>

                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>

                  <SelectContent>
                    {holidayTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.type && (
                  <p className="text-sm text-destructive">
                    {errors.type.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Date */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Date</Label>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />

                      {field.value ? format(field.value, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={(value) =>
                        field.onChange(value?.toLocaleDateString())
                      }
                    />
                  </PopoverContent>
                </Popover>

                {errors.date && (
                  <p className="text-sm text-destructive">
                    {errors.date.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Description</Label>

                <Textarea
                  rows={4}
                  placeholder="Enter description"
                  {...field}
                  value={field.value ?? ""}
                />

                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : holiday ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
