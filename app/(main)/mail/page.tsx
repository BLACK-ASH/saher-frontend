"use client";

import { UserSearchPicker } from "@/components/user-search-picker";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mailColumns } from "@/features/mail/column";
import { MailDataTable } from "@/features/mail/data-table";
import { useMail } from "@/hooks/use-mail";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { useState } from "react";
import { Reply, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input as SuInput } from "@/components/ui/input";
import { toast } from "sonner";
import {
  InboxMailT,
  MailUser,
  OutboxMailT,
  SendMailInput,
} from "@/services/mail.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { imageUrl } from "@/lib/image-url";
import { outBoxColumns } from "@/features/mail/outbox-column";
import { formatIstDateTime } from "@/lib/date";

/* ---------------- SCHEMA ---------------- */

const mailInputSchema = z.object({
  to: z.array(z.any()).min(1, "At least one recipient required"),
  cc: z.array(z.any()),
  bcc: z.array(z.any()),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

/* ---------------- PAGE ---------------- */

const Page = () => {
  const [page, setPage] = useState(1);
  const { inbox, sent, send } = useMail({ page });

  const { data: inData, refetch: inRefetch } = inbox;
  const { data: seData, refetch: seRefetch } = sent;

  const [selectedMail, setSelectedMail] = useState<
    InboxMailT | OutboxMailT | null
  >(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");

  const form = useForm<z.infer<typeof mailInputSchema>>({
    resolver: zodResolver(mailInputSchema),
    defaultValues: {
      to: [],
      cc: [],
      bcc: [],
      subject: "",
      body: "",
    },
  });

  const onSubmit = (data: z.infer<typeof mailInputSchema>) => {
    const payload: SendMailInput = {
      subject: data.subject,
      body: data.body,
      to: data.to.map((u: MailUser) => u.id),
      cc: data.cc.map((u: MailUser) => u.id),
      bcc: data.bcc.map((u: MailUser) => u.id),
    };

    send.mutate(payload, {
      onSuccess: (res) => {
        toast.success(res.message);
        form.reset();
        setActiveTab("sent");
      },
    });
  };

  return (
    <section className="p-4 container mx-auto">
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>

        {/* ---------------- INBOX ---------------- */}
        <TabsContent value="inbox">
          <MailDataTable
            columns={mailColumns}
            data={inData?.items ?? []}
            refetch={inRefetch}
            page={page}
            totalPages={inData?.totalPages ?? 1}
            onPageChange={setPage}
            onRowClick={(mail) => {
              setSelectedMail(mail);
              setOpen(true);
            }}
          />
        </TabsContent>

        {/* ---------------- SENT ---------------- */}
        <TabsContent value="sent">
          <MailDataTable
            columns={outBoxColumns}
            data={seData?.items ?? []}
            refetch={seRefetch}
            page={page}
            totalPages={seData?.totalPages ?? 1}
            onPageChange={setPage}
            onRowClick={(mail) => {
              setSelectedMail(mail);
              setOpen(true);
            }}
          />
        </TabsContent>

        {/* ---------------- COMPOSE ---------------- */}
        <TabsContent value="compose">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              {/* ---------------- TO ---------------- */}
              <Controller
                name="to"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>To</FieldLabel>
                    <UserSearchPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search users..."
                    />
                    <FieldError errors={[form.formState.errors.to]} />
                  </Field>
                )}
              />

              {/* ---------------- CC ---------------- */}
              <Controller
                name="cc"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Cc</FieldLabel>
                    <UserSearchPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search users..."
                    />
                    <FieldError errors={[form.formState.errors.cc]} />
                  </Field>
                )}
              />

              {/* ---------------- BCC ---------------- */}
              <Controller
                name="bcc"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Bcc</FieldLabel>
                    <UserSearchPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search users..."
                    />
                    <FieldError errors={[form.formState.errors.bcc]} />
                  </Field>
                )}
              />

              {/* ---------------- SUBJECT ---------------- */}
              <Controller
                name="subject"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="subject">Subject</FieldLabel>
                    <SuInput
                      {...field}
                      id="subject"
                      placeholder="Enter Subject"
                      autoComplete="off"
                    />
                    <FieldError errors={[form.formState.errors.subject]} />
                  </Field>
                )}
              />

              {/* ---------------- BODY ---------------- */}
              <Controller
                name="body"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="body">Body</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea id="body" {...field} rows={7} />
                    </InputGroup>
                    <FieldError errors={[form.formState.errors.body]} />
                  </Field>
                )}
              />

              <Button variant={"outline"} className="flex gap-3 items-center">
                <Send />
                Send
              </Button>
            </FieldGroup>
          </form>
        </TabsContent>
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="min-w-1/2 ">
          <DialogHeader>
            <DialogTitle>{selectedMail?.subject}</DialogTitle>
          </DialogHeader>
          {/* _____________________________ */}
          <div>
            <p className="font-bold">From</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={imageUrl(selectedMail?.from.image?.src)}
                  alt={selectedMail?.from.name}
                />
                <AvatarFallback className="rounded-lg">
                  {selectedMail?.from.name}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{selectedMail?.from.name}</p>
                <p>{selectedMail?.from.email}</p>
              </div>
            </div>
          </div>
          {/* _____________________________ */}
          <div className="space-y-4">
            <div>
              <p className="font-bold">To</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {selectedMail?.to.map((user) => (
                  <div key={user.email} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={imageUrl(user.image?.src)}
                        alt={user.name}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user.name}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p>{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(selectedMail?.cc?.length ?? 0) > 0 && (
              <div>
                <p className="font-bold">Cc</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {selectedMail?.cc.map((user) => (
                    <div key={user.email} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={imageUrl(user.image?.src)}
                          alt={user.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {user.name}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p>{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedMail && "bcc" in selectedMail && selectedMail.bcc.length > 0 && (
              <div>
                <p className="font-bold">Bcc</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {selectedMail?.bcc.map((user) => (
                    <div key={user.email} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={imageUrl(user.image?.src)}
                          alt={user.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {user.name}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p>{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* _____________________________ */}
            <div>
              <strong>Date:</strong>{" "}
              {formatIstDateTime(selectedMail?.createdAt)}
            </div>

            <Separator />

            <div className="w-full max-w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-all">
              {selectedMail?.body ?? ""}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (!selectedMail) return;
                const quotedBody = `\n\nOn ${formatIstDateTime(selectedMail.createdAt)}, ${selectedMail.from.name} wrote:\n> ${(selectedMail.body ?? "").split("\n").join("\n> ")}`;
                form.setValue("to", [selectedMail.from]);
                form.setValue(
                  "subject",
                  selectedMail.subject.startsWith("Re: ")
                    ? selectedMail.subject
                    : `Re: ${selectedMail.subject}`,
                );
                form.setValue("body", quotedBody);
                setOpen(false);
                setActiveTab("compose");
              }}
            >
              <Reply className="h-4 w-4" /> Reply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Page;
