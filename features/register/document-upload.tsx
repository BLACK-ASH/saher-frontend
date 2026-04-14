import ImageUpload from "@/components/image-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Controller, UseFormReturn } from "react-hook-form"
import { RegisterFormData } from "./register-schema"

const UploadDocument = ({ form }: { form: UseFormReturn<RegisterFormData> }) => {
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
                  url={form.getValues("uploaded.aadhar")}
                  altName={"aadhar" + form.getValues("user.name")}
                  onUploadSuccess={(data) => {
                    form.setValue("account.aadhar", data.file.id)
                    form.setValue("uploaded.aadhar", data.file.url)
                  }}
                />
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
                  url={form.getValues("uploaded.pan")}
                  altName={"pan" + form.getValues("user.name")}
                  onUploadSuccess={(data) => {
                    form.setValue("account.pan", data.file.id)
                    form.setValue("uploaded.pan", data.file.url)
                  }}
                />
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
                  url={form.getValues("uploaded.resume")}
                  altName={"resume" + form.getValues("user.name")}
                  onUploadSuccess={(data) => {
                    form.setValue("account.resume", data.file.id)
                    form.setValue("uploaded.resume", data.file.url)
                  }}
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
  )
}

export default UploadDocument
