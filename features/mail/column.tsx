"use client";

import { MailT } from "@/services/mail.api";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { imageUrl } from "@/lib/image-url";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const mailColumns: ColumnDef<MailT>[] = [
  {
    accessorKey: "from",
    header: () => <div>From</div>,
    cell: ({ row }) => {
      const user = row.original.from;

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={imageUrl(user.image?.src)} alt={user.name} />
            <AvatarFallback className="rounded-lg">{user.name}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{user.name}</p>
            <p>{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "subject",
    header: () => <div>Subject</div>,
    cell: ({ row }) => {
      const subject = row.getValue<string>("subject");
      return <p className="font-bold">{subject}</p>;
    },
  },
  {
    accessorKey: "body",
    header: () => <div>Body</div>,
    cell: ({ row }) => {
      const body = row.getValue<string>("body");
      return <p className="">{body.slice(0, 100)}</p>;
    },
  },
];
