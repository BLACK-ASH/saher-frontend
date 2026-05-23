"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImageUpload from "@/components/image-upload";
import { AccountT } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Key,
  MailCheck,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { apiFetch } from "@/lib/api-wrapper";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FieldLabel } from "@/components/ui/field";

type Props = { account: AccountT };

function ProfileInfo({ account }: Props) {
  const queryClient = useQueryClient();
  const [display, setDisplay] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("");

  const handleChangeEmail = async () => {
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
    const res = await apiFetch(`/api/auth/change-password/request`, {
      method: "POST",
    });
    if (!res.success) {
      toast.error(res.message);
    }
    toast.success(res.message);
    queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  const handleChangeProfile = async () => {
    const payload = {
      image: image || user.image.id,
      displayName: nameRef.current?.value || user.displayName,
    };
    const res = await apiFetch(`/api/user`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (!res.success) {
      toast.error(res.message);
    }
    toast.success(res.message);
    queryClient.invalidateQueries({ queryKey: ["user"] });
    setDisplay(false);
  };

  const { user } = account;
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="flex items-center gap-6 flex-col md:flex-row">
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

      {/* meta */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>Employee ID: {account.employeeId}</p>
        <Dialog open={display} onOpenChange={setDisplay}>
          <DialogTrigger asChild>
            <Button
              variant={"outline"}
              className="flex gap-2 items-center w-44 justify-start"
            >
              <Edit />
              Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="p-2 min-w-1/3">
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription></DialogDescription>

            <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
            <Input
              id="displayName"
              defaultValue={user.displayName}
              placeholder="Enter New Name..."
              ref={nameRef}
            />

            <FieldLabel>Profile Image</FieldLabel>
            <ImageUpload
              altName={account.user.id}
              url={account.user.image.src}
              onUploadSuccess={(data) => {
                setImage(data.id);
              }}
            />
            <Button
              className="m-2 items-center"
              onClick={() => handleChangeProfile()}
            >
              Update Profile
            </Button>
          </DialogContent>
        </Dialog>
        <Button
          variant={"outline"}
          className="flex gap-2 items-center w-44 justify-start"
          onClick={() => handleChangePassword()}
        >
          <Key />
          Change Password
        </Button>
        <Button
          variant={"outline"}
          className="flex gap-2 items-center w-44 justify-start"
          onClick={() => handleChangeEmail()}
        >
          <Edit />
          Change Email
        </Button>
      </div>
    </div>
  );
}

export default ProfileInfo;
