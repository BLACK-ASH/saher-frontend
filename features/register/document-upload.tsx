import ImageUpload from "@/components/image-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Controller, UseFormReturn } from "react-hook-form"
import { RegisterFormData } from "./register-schema"

const UploadDocument = ({form}:{form:UseFormReturn<RegisterFormData>}) => {
  return (
    <Card className="min-w-full sm:max-w-md">
      <CardHeader >
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent className="flex max-md:flex-col flex-row ">
        <FieldGroup>

          <Controller
            name="account.aadhar"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="aadhar">Aadhar Card</FieldLabel>
                <ImageUpload
                  altName={form.getValues("user.name")+" - aadhar"}
                  onUploadSuccess={(data) => form.setValue("account.aadhar", data.file.id)}
                />
                <FieldDescription>Image Must Must Be Provided With A Name</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="account.pan"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="pan">Pan Card</FieldLabel>
                <ImageUpload
                  altName={form.getValues("user.name")+" - pan"}
                  onUploadSuccess={(data) => form.setValue("account.pan", data.file.id)}
                />
                <FieldDescription>Image Must Must Be Provided With A Name</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="account.resume"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="resume">Resume</FieldLabel>
                <ImageUpload
                  altName={form.getValues("user.name")+" - resume"}
                  onUploadSuccess={(data) => form.setValue("account.resume", data.file.id)}
                />
                <FieldDescription>Image Must Must Be Provided With A Name</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default UploadDocument
