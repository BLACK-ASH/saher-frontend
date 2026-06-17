"use client";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { UserCheck, MailCheck, Ban, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileInfo from "./profile-info";
import EmailVerification from "./email-verification";
import { NotificationCard } from "../notification/register-push";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  const { data: account, isLoading } = useProfile();

  if (isLoading) return <DefaultLoader />;
  if (!account) return <NoData title="No Profile To Show" description="" />;

  const { user, bank } = account;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <NotificationCard dbEnabled={account.user.pushNotificationsEnabled} />
      {!account.user.emailVerified && <EmailVerification />}
      {/* ================= HEADER ================= */}
      <ProfileInfo account={account} />
      <Separator />

      {/* ================= CONTENT ================= */}
      <div className="flex flex-col-reverse md:flex-row gap-4">
        {/* LEFT */}
        <div className="space-y-10 flex-2 ">
          <Section title="Personal Information">
            <Grid>
              <Field label="Full Name" value={user.name} />
              <Field label="Display Name" value={user.displayName || "-"} />
              <Field label="Gender" value={account.gender} />
              <Field label="Phone" value={account.phoneNumber} />
              <Field
                label="Date of Birth"
                value={formatDate(account.dateOfBirth)}
              />
              <Field label="Address" value={account.address} full />
            </Grid>
          </Section>

          <Section title="Employment">
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
                value={formatDate(account.dateOfJoining)}
              />
              <Field
                label="Salary Structure"
                value={account.salaryStructure}
                full
              />
            </Grid>
          </Section>

          <Section title="Bank Details">
            <Grid>
              <Field label="Account Holder" value={bank.accountHolderName} />
              <Field label="Bank Name" value={bank.bankName} />
              <Field label="Account Number" value={bank.accountNumber} />
              <Field label="IFSC" value={bank.ifcs} />
              <Field label="Branch" value={bank.branch} />
              <Field label="Mobile" value={bank.mobileNumber} />
            </Grid>
          </Section>

          <Section title="Documents">
            <Accordion type="single" collapsible defaultValue="aadhar">
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
            </Accordion>
          </Section>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6 flex-1">
          <div className="sticky top-6 space-y-4">
            <Card className="border-muted/60">
              <CardHeader className="pb-3">
                <CardTitle>Account Status</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* STATUS ROWS */}
                <StatusRow
                  icon={MailCheck}
                  label="Email Verification"
                  value={user.emailVerified}
                  positive="Verified"
                  negative="Not Verified"
                  variant={user.emailVerified ? "outline-success" : "outline"}
                />

                <StatusRow
                  icon={UserCheck}
                  label="Account State"
                  value={user.isActive}
                  positive="Active"
                  negative="Inactive"
                  variant={user.isActive ? "verify" : "outline-warn"}
                />

                <StatusRow
                  icon={Ban}
                  label="Restriction"
                  value={!user.isBanned}
                  positive="No Restrictions"
                  negative="Banned"
                  variant={!user.isBanned ? "success" : "destructive"}
                />

                {(user.bannedAt || user.deletedAt) && <Separator />}

                {/* META */}
                {user.bannedAt && (
                  <MetaRow
                    icon={Ban}
                    label="Banned At"
                    value={formatDate(user.bannedAt)}
                  />
                )}

                {user.deletedAt && (
                  <MetaRow
                    icon={Trash2}
                    label="Deleted At"
                    value={formatDate(user.deletedAt)}
                    danger
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= UI ================= */

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

/* ================= HELPERS ================= */

function formatDate(date?: Date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

function maskAccount(acc: string) {
  return `•••• ${acc.slice(-4)}`;
}

function StatusRow({
  icon: Icon,
  label,
  value,
  positive,
  negative,
  variant,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: boolean;
  positive: string;
  negative: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variant: any;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>

      <Badge variant={variant}>{value ? positive : negative}</Badge>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  danger,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>

      <span className={danger ? "text-destructive" : ""}>{value}</span>
    </div>
  );
}
