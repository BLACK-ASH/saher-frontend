"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, UseFormReturn } from "react-hook-form";
import { RegisterFormData } from "./register-schema";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

const employeeType = ["volunteer", "part-time", "full-time"];
const employeeShift = [
  {
    label: "9:00 AM - 1:00 PM",
    value: "shift-1",
  },
  {
    label: "1:00 AM - 6:00 PM",
    value: "shift-2",
  },
];

export type EmployeeType = (typeof employeeType)[number];

const EmployeeDetail = ({
  form,
}: {
  form: UseFormReturn<RegisterFormData>;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="min-w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Employee Detail</CardTitle>
      </CardHeader>
      <CardContent className="flex max-md:flex-col flex-row ">
        <FieldGroup>
          <Controller
            name="account.employeeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="employee-id">Employee Id</FieldLabel>
                <Input
                  {...field}
                  id="employee-id"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter Employee Id"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="account.employeeType"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="employee-type">Employee Type</FieldLabel>
                <Select
                  {...field}
                  aria-invalid={fieldState.invalid}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {employeeType.map((type) => {
                        return (
                          <SelectItem key={type} value={type}>
                            {type.toLocaleUpperCase()}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="account.employeeShift"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="employee-type">Employee Shift</FieldLabel>
                <Select
                  {...field}
                  aria-invalid={fieldState.invalid}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {employeeShift.map((type) => {
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="account.department"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="department">Department</FieldLabel>
                <Input
                  {...field}
                  id="department"
                  placeholder="department"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="account.designation"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="designation">Designation</FieldLabel>
                <Input
                  {...field}
                  id="designation"
                  aria-invalid={fieldState.invalid}
                  placeholder="designation"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="account.salaryStructure"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="salary">Salary Structure</FieldLabel>
                <Input
                  {...field}
                  id="salary"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="account.dateOfJoining"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="doj">Date Of Joining</FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="doj"
                      className="justify-start font-normal"
                    >
                      {field.value
                        ? new Date(field.value).toDateString()
                        : "Select Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={new Date()}
                      defaultMonth={new Date()}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        form.setValue(
                          "account.dateOfJoining",
                          date?.toDateString() || "",
                        );
                        setOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default EmployeeDetail;
