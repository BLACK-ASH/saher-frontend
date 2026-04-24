"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  MailCheck,
  Ban,
  Trash2,
  Edit,
  Key,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";
import { useRef, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const { data: account, isLoading } = useProfile({});
  const queryClient = useQueryClient();
  const [display, setDisplay] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <DefaultLoader />;
  if (!account) return <NoData title="No Profile To Show" description="" />;

  const { user, bank } = account;

  const handleChangeEmail = async () => {
    console.log("Email Change Request Send.");
    const res = await apiFetch(`/api/auth/change-email/request`, {
      method: "POST",
    });
    if (!res.success) {
      toast.error(res.message);
    }
    toast.success(res.message);
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  const handleChangePassword = async () => {
    console.log("Email Change Request Send.");
    const res = await apiFetch(`/api/auth/change-password/request`, {
      method: "POST",
    });
    if (!res.success) {
      toast.error(res.message);
    }
    toast.success(res.message);
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  const handleChangeName = async () => {
    const payload = { displayName: nameRef.current?.value };
    const res = await apiFetch(`/api/user`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (!res.success) {
      toast.error(res.message);
    }
    toast.success(res.message);
    setDisplay(false);
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* 🔥 Bigger Avatar */}
          <Avatar className="size-40 border ">
            <AvatarImage src={user.image?.src} />
            <AvatarFallback className="text-lg">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {user.displayName}
              </h1>
              <Button
                variant={"link"}
                onClick={() => setDisplay((prev) => !prev)}
              >
                <Edit />
              </Button>
            </div>

            {display && (
              <InputGroup className="my-2">
                <InputGroupInput
                  placeholder="Enter New Name..."
                  ref={nameRef}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    variant="secondary"
                    onClick={() => handleChangeName()}
                  >
                    Change
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            )}
            <div className="flex items-center">
              <p className="text-muted-foreground text-sm col-span-2">
                {user.email}
              </p>
              <Button variant={"link"} onClick={() => handleChangeEmail()}>
                {" "}
                <Edit />
              </Button>
            </div>

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
                <Badge
                  variant="outline-warn"
                  className="flex items-center gap-1"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Inactive
                </Badge>
              )}

              {user.isBanned && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Banned
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* meta */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>ID: {account.id}</p>
          <p>Employee ID: {account.employeeId}</p>
          <Button
            variant={"outline"}
            className="flex gap-2 items-center "
            onClick={() => handleChangePassword()}
          >
            <Key />
            Change Password
          </Button>
        </div>
      </div>
      <Separator />

      {/* ================= CONTENT ================= */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-10">
        {/* LEFT */}
        <div className="space-y-10">
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
              <Field
                label="Account Number"
                value={maskAccount(bank.accountNumber)}
              />
              <Field label="IFSC" value={bank.ifcs} />
              <Field label="Branch" value={bank.branch} />
              <Field label="Mobile" value={bank.mobileNumber} />
            </Grid>
          </Section>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          <div className="sticky top-6">
            <Card className="border-muted/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Account Status
                </CardTitle>
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

function Status({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ? "Yes" : "No"}</span>
    </div>
  );
}

function Meta({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={danger ? "text-destructive" : ""}>{value}</span>
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
  icon: any;
  label: string;
  value: boolean;
  positive: string;
  negative: string;
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
