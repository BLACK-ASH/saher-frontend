"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import ImageUpload from "@/components/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const roles = ["user", "manager", "admin"] as const;
const genders = ["male", "female", "other"] as const;

const BasicDetail = ({ form }: { form: UseFormReturn<RegisterFormData> }) => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="min-w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Basic User Information</CardTitle>
      </CardHeader>
      <CardContent className="flex max-md:flex-col flex-row ">
        <FieldGroup className="w-1/2 m-2 max-md:w-full ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="user.name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-name">Username</FieldLabel>
                  <Input
                    {...field}
                    id="user-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter User Name"
                    autoComplete="off"
                  />
                  <FieldDescription>Username Must Be Unique</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="user.displayName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-name">Display Name</FieldLabel>
                  <Input
                    {...field}
                    id="user-display-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter User Display Name"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <Controller
            name="user.email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...field}
                  id="email"
                  placeholder="user@saher.com"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                <FieldDescription>Email Must Be Unique</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="user.role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="role">Role</FieldLabel>
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
                      {roles.map((role) => {
                        return (
                          <SelectItem key={role} value={role}>
                            {role.toLocaleUpperCase()}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>Role Must Be Selected</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="user.image"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email">Image</FieldLabel>
                <ImageUpload
                  altName={"user-" + form.getValues("user.name")}
                  url={form.getValues("uploaded.image")}
                  onUploadSuccess={(data) => {
                    form.setValue("user.image", data.file.id);
                    form.setValue("uploaded.image", data.file.url);
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <Separator orientation="vertical" />
        <FieldGroup className="w-1/2 m-2 max-md:w-full">
          <Controller
            name="account.gender"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
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
                      {genders.map((gender) => {
                        return (
                          <SelectItem key={gender} value={gender}>
                            {gender.toLocaleUpperCase()}
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
            name="account.dateOfBirth"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="dob">Date Of Birth</FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="dob"
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
                          "account.dateOfBirth",
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

          <Controller
            name="account.phoneNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="phone-number">Phone Number</FieldLabel>
                <Input
                  {...field}
                  id="phone-number"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter Phone Number"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="account.secondaryPhoneNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="secondary-phone-number">
                  Secondary Phone Number
                </FieldLabel>
                <Input
                  {...field}
                  id="secondary-phone-number"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter Secondary Phone Number"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="account.address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Textarea
                  {...field}
                  id="address"
                  rows={6}
                  className="min-h-24 resize-none"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter Address"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
};

export default BasicDetail;
