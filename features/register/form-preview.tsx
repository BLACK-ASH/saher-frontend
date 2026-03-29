"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterFormData } from "./register-schema";

type Props = {
  data: RegisterFormData;
};

export default function FormPreview({ data }: Props) {
  return (
    <div className="space-y-6">

      {/* 🔹 USER DETAILS */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <PreviewItem label="Name" value={data.user.name} />
          <PreviewItem label="Display Name" value={data.user?.displayName || " - "} />
          <PreviewItem label="Email" value={data.user.email} />
          <PreviewItem label="Role" value={data.user.role} />
          <PreviewItem label="Image ID" value={data.user.image} />
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

      {/* 🔹 DOCUMENTS */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <PreviewItem label="Aadhar ID" value={data.account.aadhar} />
          <PreviewItem label="PAN ID" value={data.account.pan} />
          <PreviewItem label="Resume ID" value={data.account.resume} />
          <PreviewItem label="Bank ID" value={data.account.bankDetail || "Not created yet"} />
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
