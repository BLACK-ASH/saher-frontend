"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RegisterFormData, registerFormSchema } from "./register-schema";
import BasicDetail from "./basic-details";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import BankDetail from "./bank-details";
import EmployeeDetail from "./employee-details";
import UploadDocument from "./document-upload";
import FormPreview from "./form-preview";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RegisterUserForm() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      user: {
        name: "",
        displayName: "",
        email: "",
        role: "user",
        image: "",
      },
      account: {
        employeeId: "",
        gender: "other",
        dateOfBirth: "",
        dateOfJoining: "",
        employeeType: "full-time",
        phoneNumber: "",
        secondaryPhoneNumber: "",
        address: "",
        department: "",
        designation: "",
        salaryStructure: "",
        aadhar: "",
        pan: "",
        resume: "",
      },
      bank: {
        accountHolderName: "",
        bankName: "",
        branch: "",
        mobileNumber: "",
        ifcs: "",
      },
    },
  });

  // 🔥 Step-wise validation fields
  const stepFields: Record<number, string[]> = {
    1: [
      "user.name",
      "user.email",
      "user.role",
      "user.image",
      "account.gender",
      "account.dateOfBirth",
      "account.phoneNumber",
      "account.secondaryPhoneNumber",
      "account.address",
    ],
    2: [
      "bank.accountHolderName",
      "bank.accountNumber",
      "bank.branch",
      "bank.bankName",
      "bank.ifcs",
      "bank.mobileNumber",
    ],
    3: [
      "account.employeeId",
      "account.employeeType",
      "account.employeeShift",
      "account.salaryStructure",
      "account.department",
      "account.designation",
      "account.dateOfJoining",
    ],
    4: ["account.aadhar", "account.pan", "account.resume"],
  };

  const stepName = [
    "Basic Infomation",
    "Bank Details",
    "Employee Details",
    "Documents Uploads",
  ];

  // 🔹 Next Step
  const nextStep = async () => {
    const fields = stepFields[step];
    const isValid = await form.trigger(fields as any);

    if (!isValid) return;

    setStep((prev) => prev + 1);
  };

  // 🔹 Previous Step
  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  // 🔹 Final Submit
  const onSubmit = async (data: RegisterFormData) => {
    // 👉 handle API calls here (bank → user)

    try {
      const response = await apiFetch("/api/admin/account", {
        method: "POST",
        body: JSON.stringify({
          user: data.user,
          account: data.account,
          bank: data.bank,
        }),
      });

      if (!response.success) return toast.error(response.message);

      toast.success(response.message);
      setStep(1);
      form.reset();
      router.refresh();
    } catch (err) {
      console.log(err);
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  const onError = (err: any) => {
    console.log("ERRORS:", err);
  };

  return (
    <div className="w-full p-4 md:w-2/3 mx-auto space-y-6">
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="space-y-6 w-full"
      >
        {/* 🔥 Navigation Buttons */}
        <div className="flex justify-between gap-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
          )}

          {step < 5 ? (
            <Field className="w-full max-w-sm mx-auto">
              <FieldLabel htmlFor="progress-upload">
                <span>{stepName[step - 1]}</span>
                <span className="ml-auto">{25 * (step - 1)}%</span>
              </FieldLabel>
              <Progress value={(step - 1) * 25} id="progress-upload" />
            </Field>
          ) : (
            <h1 className="text-2xl font-bold text-center">Preview</h1>
          )}

          {step < 4 && (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          )}

          {step === 4 && (
            <Button
              type="button"
              onClick={() => setStep((prev) => prev + 1)}
              className="bg-amber-400 font-bold"
            >
              Preview
            </Button>
          )}

          {step === 5 && (
            <Button type="submit" className="bg-green-700 font-bold">
              Submit
            </Button>
          )}
        </div>

        {/* <Separator /> */}

        {step === 1 && <BasicDetail form={form} />}
        {step === 2 && <BankDetail form={form} />}
        {step === 3 && <EmployeeDetail form={form} />}
        {step === 4 && <UploadDocument form={form} />}
        {step === 5 && <FormPreview data={form.getValues()} />}
      </form>
    </div>
  );
}
