"use client";

import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminAccount } from "@/hooks/use-admin";
import { formatIstDate } from "@/lib/date";
import { can } from "@/lib/permissions";
import RoleAccess from "@/components/role-access";
import AccountEditDialog from "@/features/admin/account-edit";
import { BankDetailForm, maskAccount } from "@/features/admin/bank-details";
import { useState } from "react";
import { MailCheck, Pencil, ShieldCheck, UserCheck, UserX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

function ManagerUserPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const [editOpen, setEditOpen] = useState(false);
  const [bankEditOpen, setBankEditOpen] = useState(false);

  const { data: account, isLoading } = useAdminAccount(id);

  if (isLoading) {
    return <DefaultLoader />;
  }

  if (!account) {
    return <NoData title="User Not Found" description=""></NoData>;
  }
  const { user, bank } = account;
  return (
    <section className="w-full md:w-2/3 lg:1/2 mx-auto mt-8 py-8 space-y-2">
      {" "}
      <div className="flex items-center my-4 gap-6 flex-col md:flex-row">
        {/* 🔥 Bigger Avatar */}
        <div>
          <Avatar className="size-40 border ">
            <AvatarImage src={user.image?.src} />
            <AvatarFallback className="text-lg">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.displayName}
            </h1>
          </div>

          <div className="flex items-center">
            <p className="text-muted-foreground text-sm col-span-2">
              {user.email}
            </p>
          </div>

          <p>Employee ID: {account.employeeId}</p>
          {/* 🔥 Better Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user.role}
            </Badge>

            {user.emailVerified && (
              <Badge
                variant="outline-success"
                className="flex items-center gap-1"
              >
                <MailCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            )}

            {user.isActive ? (
              <Badge variant="verify" className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline-warn" className="flex items-center gap-1">
                <UserX className="h-3.5 w-3.5" />
                Inactive
              </Badge>
            )}

            {user.isBanned && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <UserX className="h-3.5 w-3.5" />
                Banned
              </Badge>
            )}
          </div>
        </div>
      </div>
      {/* // outline-warn */}
      <div className="space-y-10 flex-2 ">
        <Section title="Personal Information">
          <Grid>
            <Field label="Full Name" value={user.name} />
            <Field label="Display Name" value={user.displayName || "-"} />
            <Field label="Gender" value={account.gender} />
            <Field label="Phone" value={account.phoneNumber} />
            <Field
              label="Date of Birth"
              value={formatIstDate(account.dateOfBirth)}
            />
            <Field label="Address" value={account.address} full />
          </Grid>
        </Section>

        <Section title="Employment">
          <RoleAccess
            allow={(r) => can(r, "update", "account")}
            fallback={null}
          >
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit Account
              </Button>
            </div>
          </RoleAccess>
          <Grid>
            <Field label="Department" value={account.department} />
            <Field label="Designation" value={account.designation} />
            <Field label="Employee Type" value={account.employeeType} />
            <Field
              label="Shift"
              value={account.employeeShift || "Not Assigned"}
            />
            <Field
              label="Date of Joining"
              value={formatIstDate(account.dateOfJoining)}
            />
            <Field
              label="Salary Structure"
              value={account.salaryStructure}
              full
            />
          </Grid>
        </Section>

        <Section title="Bank Details">
          <RoleAccess
            allow={(r) => can(r, "write", "bank") || can(r, "update", "bank")}
            fallback={null}
          >
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBankEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit Bank Details
              </Button>
            </div>
          </RoleAccess>
          {bank ? (
            <Grid>
              <Field label="Account Holder" value={bank.accountHolderName} />
              <Field label="Bank Name" value={bank.bankName} />
              <Field label="Account Number" value={maskAccount(bank.accountNumber)} />
              <Field label="IFSC" value={bank.ifcs} />
              <Field label="Branch" value={bank.branch} />
              <Field label="Mobile" value={bank.mobileNumber} />
            </Grid>
          ) : (
            <p className="text-sm text-muted-foreground">Not provided</p>
          )}
        </Section>

        <Section title="Documents">
          <Accordion type="single" collapsible defaultValue="aadhar">
            {account.aadhar ? (
              <AccordionItem value="aadhar">
                <AccordionTrigger>Aadhar Card</AccordionTrigger>
                <AccordionContent>
                  <Image
                    src={account.aadhar.src}
                    alt={account.aadhar.alt}
                    height={400}
                    width={400}
                  />
                  <Link href={account.aadhar.src} download={account.aadhar.alt}>
                    <Button className="my-4" variant={"outline"}>
                      Download
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
            ) : (
              <AccordionItem value="aadhar" disabled>
                <AccordionTrigger>Aadhar Card — Not uploaded</AccordionTrigger>
              </AccordionItem>
            )}
            {account.pan ? (
              <AccordionItem value="pan">
                <AccordionTrigger>Pan Card</AccordionTrigger>
                <AccordionContent>
                  <Image
                    src={account.pan.src}
                    alt={account.pan.alt}
                    height={400}
                    width={400}
                  />
                  <Link href={account.pan.src} download={account.pan.alt}>
                    <Button className="my-4" variant={"outline"}>
                      Download
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
            ) : (
              <AccordionItem value="pan" disabled>
                <AccordionTrigger>Pan Card — Not uploaded</AccordionTrigger>
              </AccordionItem>
            )}
            {account.resume ? (
              <AccordionItem value="resume">
                <AccordionTrigger>Resume</AccordionTrigger>
                <AccordionContent>
                  <Image
                    src={account.resume.src}
                    alt={account.resume.alt}
                    height={400}
                    width={400}
                  />
                  <Link href={account.resume.src} download={account.resume.alt}>
                    <Button className="my-4" variant={"outline"}>
                      Download
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
            ) : (
              <AccordionItem value="resume" disabled>
                <AccordionTrigger>Resume — Not uploaded</AccordionTrigger>
              </AccordionItem>
            )}
          </Accordion>
        </Section>
      </div>

      {account && (
        <>
          <AccountEditDialog
            account={account}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <BankDetailForm
            bank={bank}
            open={bankEditOpen}
            onOpenChange={setBankEditOpen}
          />
        </>
      )}
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-4">{title}</h2>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">{children}</div>;
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-full" : ""}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}
export default ManagerUserPage;
