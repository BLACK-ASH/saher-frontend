"use client";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mailColumns } from "@/features/mail/column";
import { MailDataTable } from "@/features/mail/data-table";
import { useMail } from "@/hooks/use-mail";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@base-ui/react";
import { Input as SuInput } from "@/components/ui/input";
import { toast } from "sonner";
import { MailT } from "@/services/mail.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { imageUrl } from "@/lib/image-url";
import { outBoxColumns } from "@/features/mail/outbox-colunm";

/* ---------------- TYPES ---------------- */

type MailUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: {
    id: string;
    src: string;
    alt: string;
  };
};

/* ---------------- SCHEMA ---------------- */

const mailInputSchema = z.object({
  to: z.array(z.any()),
  cc: z.array(z.any()),
  bcc: z.array(z.any()),
  subject: z.string(),
  body: z.string(),
});

/* ---------------- PAGE ---------------- */

const Page = () => {
  const { inbox, sent, send } = useMail();

  const [toKeyword, setToKeyword] = useState("");
  const [ccKeyword, setCcKeyword] = useState("");
  const [bccKeyword, setBccKeyword] = useState("");

  const { user: toUser } = useMail(toKeyword);
  const { user: ccUser } = useMail(ccKeyword);
  const { user: bccUser } = useMail(bccKeyword);

  const { data: toData = [] } = toUser;
  const { data: ccData = [] } = ccUser;
  const { data: bccData = [] } = bccUser;

  const { data: inData, refetch: inRefetch } = inbox;
  const { data: seData, refetch: seRefetch } = sent;

  const [selectedMail, setSelectedMail] = useState<MailT | null>(null);
  const [open, setOpen] = useState(false);

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
    const payload = {
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
      },
    });
  };

  return (
    <section className="p-3 container mx-auto h-[calc(100vh-100px)]">
      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>

        {/* ---------------- INBOX ---------------- */}
        <TabsContent value="inbox">
          <MailDataTable
            columns={mailColumns}
            data={inData || []}
            refetch={inRefetch}
            onRowClick={(mail) => {
              console.log(mail);
              setSelectedMail(mail);
              setOpen(true);
            }}
          />
        </TabsContent>

        {/* ---------------- SENT ---------------- */}
        <TabsContent value="sent">
          <MailDataTable
            columns={outBoxColumns}
            data={seData || []}
            refetch={seRefetch}
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
                    <FieldLabel htmlFor="to">To</FieldLabel>

                    {/* chips */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {field.value.map((user: MailUser) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm"
                        >
                          {user.name} ({user.email})
                          <button
                            type="button"
                            onClick={() =>
                              field.onChange(
                                field.value.filter(
                                  (u: MailUser) => u.id !== user.id,
                                ),
                              )
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Input
                      id="to"
                      placeholder="Search users..."
                      value={toKeyword}
                      onChange={(e) => setToKeyword(e.target.value)}
                    />

                    <div className="border mt-2 rounded-md max-h-40 overflow-auto">
                      {toData.map((user: MailUser) => (
                        <div
                          key={user.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer"
                          onClick={() => {
                            if (
                              !field.value.some(
                                (u: MailUser) => u.id === user.id,
                              )
                            ) {
                              field.onChange([...field.value, user]);
                              setToKeyword("");
                            }
                          }}
                        >
                          {user.name} — {user.email}
                        </div>
                      ))}
                    </div>
                  </Field>
                )}
              />

              {/* ---------------- CC ---------------- */}
              <Controller
                name="cc"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="cc">Cc</FieldLabel>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {field.value.map((user: MailUser) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm"
                        >
                          {user.name} ({user.email})
                          <button
                            type="button"
                            onClick={() =>
                              field.onChange(
                                field.value.filter(
                                  (u: MailUser) => u.id !== user.id,
                                ),
                              )
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Input
                      id="cc"
                      placeholder="Search users..."
                      value={ccKeyword}
                      onChange={(e) => setCcKeyword(e.target.value)}
                    />

                    <div className="border mt-2 rounded-md max-h-40 overflow-auto">
                      {ccData.map((user: MailUser) => (
                        <div
                          key={user.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer"
                          onClick={() => {
                            if (
                              !field.value.some(
                                (u: MailUser) => u.id === user.id,
                              )
                            ) {
                              field.onChange([...field.value, user]);
                            }
                          }}
                        >
                          {user.name} — {user.email}
                        </div>
                      ))}
                    </div>
                  </Field>
                )}
              />

              {/* ---------------- BCC ---------------- */}
              <Controller
                name="bcc"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="bcc">Bcc</FieldLabel>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {field.value.map((user: MailUser) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-sm"
                        >
                          {user.name} ({user.email})
                          <button
                            type="button"
                            onClick={() =>
                              field.onChange(
                                field.value.filter(
                                  (u: MailUser) => u.id !== user.id,
                                ),
                              )
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Input
                      id="bcc"
                      placeholder="Search users..."
                      value={bccKeyword}
                      onChange={(e) => setBccKeyword(e.target.value)}
                    />

                    <div className="border mt-2 rounded-md max-h-40 overflow-auto">
                      {bccData.map((user: MailUser) => (
                        <div
                          key={user.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer"
                          onClick={() => {
                            if (
                              !field.value.some(
                                (u: MailUser) => u.id === user.id,
                              )
                            ) {
                              field.onChange([...field.value, user]);
                            }
                          }}
                        >
                          {user.name} — {user.email}
                        </div>
                      ))}
                    </div>
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
                  <div className="flex items-center gap-3">
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

            {selectedMail?.cc && (
              <div>
                <p className="font-bold">CC</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {selectedMail?.cc.map((user) => (
                    <div className="flex items-center gap-3">
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

            {selectedMail?.bcc && (
              <div>
                <p className="font-bold">CC</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {selectedMail?.bcc.map((user) => (
                    <div className="flex items-center gap-3">
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
              {new Date(selectedMail?.createdAt as Date).toLocaleString()}
            </div>

            <Separator />

            <div className="w-full max-w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-all">
              {selectedMail?.body}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Page;
