"use client";

import { DefaultLoader } from "@/components/loading";
import { NoData } from "@/components/no-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AccountT } from "@/hooks/use-profile";
import { apiFetch } from "@/lib/api-wrapper";
import { formatDate } from "@fullcalendar/core/index.js";
import { useQuery } from "@tanstack/react-query";
import { MailCheck, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useParams } from "next/navigation";
function page() {
  const params = useParams<{ id: string }>();
  const { id } = params;

  const data = useQuery({
    queryKey: ["user", "profile", "me"],
    queryFn: async () => {
      const res = await apiFetch<AccountT>(`/api/admin/user/${id}`);
      return res.data;
    },
    retry: 3,
    staleTime: 1000 * 60,
  });

  if (data.isLoading) {
    return <DefaultLoader />;
  }

  if (!data.data) {
    return <NoData title="User Not Found" description=""></NoData>;
  }
  const account = data.data;
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
      </div>
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

export default page;
