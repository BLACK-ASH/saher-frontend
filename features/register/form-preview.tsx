"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterFormData } from "./register-schema";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type Props = {
  data: RegisterFormData;
};

export default function FormPreview({ data }: Props) {
  return (
    <div className="space-y-6 my-4">

      {/* 🔹 USER DETAILS */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="h-60">
            <Label className="my-4">Profile Image</Label>
            <AspectRatio ratio={1 / 1} className="rounded-full bg-muted size-48 overflow-hidden">
              <Image
                src={data.uploaded?.image ?? ""}
                alt={data.user.image}
                fill
              />
            </AspectRatio>
          </div>
          <div className="space-y-4">
            <PreviewItem label="Name" value={data.user.name} />
            <PreviewItem label="Display Name" value={data.user?.displayName || data.user.name} />
            <PreviewItem label="Email" value={data.user.email} />
            <PreviewItem label="Role" value={data.user.role} />
          </div>
        </CardContent>
      </Card>

      {/* 🔹 ACCOUNT DETAILS */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <PreviewItem label="Employee ID" value={data.account.employeeId} />
          <PreviewItem label="Gender" value={data.account.gender} />
          <PreviewItem label="DOB" value={data.account.dateOfBirth} />
          <PreviewItem label="Joining Date" value={data.account.dateOfJoining} />
          <PreviewItem label="Type" value={data.account.employeeType} />
          <PreviewItem label="Phone" value={data.account.phoneNumber} />
          <PreviewItem label="Secondary Phone" value={data.account?.secondaryPhoneNumber || " - "} />
          <PreviewItem label="Department" value={data.account.department} />
          <PreviewItem label="Designation" value={data.account.designation} />
          <PreviewItem label="Salary" value={data.account.salaryStructure} />
          <PreviewItem label="Address" value={data.account.address} />
        </CardContent>
      </Card>

      {/* 🔹 BANK DETAILS */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <PreviewItem label="Account Holder" value={data.bank.accountHolderName} />
          <PreviewItem label="Bank Name" value={data.bank.bankName} />
          <PreviewItem label="Branch" value={data.bank.branch} />
          <PreviewItem label="Mobile" value={data.bank.mobileNumber} />
          <PreviewItem label="IFSC" value={data.bank.ifcs} />
        </CardContent>
      </Card>
      {/* 🔹 DOCUMENTS */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent >
          <Label className="my-4">Aadhar</Label>
          <AspectRatio ratio={1 / 1}>
            <Image
              src={data.uploaded?.aadhar ?? ''}
              alt={data.account?.aadhar}
              className="object-contain"
              fill
            />
          </AspectRatio>
          <Label className="my-4">Pan</Label>
          <AspectRatio ratio={1 / 1}>
            <Image
              src={data.uploaded?.pan ?? ''}
              alt={data.account?.pan}
              className="object-contain"
              fill
            />
          </AspectRatio>
          <Label className="my-4">Resume</Label>
          <AspectRatio ratio={1 / 1}>
            <Image
              src={data.uploaded?.resume ?? ''}
              alt={data.account?.resume}
              className="object-contain"
              fill
            />
          </AspectRatio>
        </CardContent>
      </Card>


    </div>
  );
}

// 🔹 Reusable Field Component
function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="font-medium break-all">
        {value || "-"}
      </span>
    </div>
  );
}
