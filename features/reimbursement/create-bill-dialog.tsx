import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { userBillCreateSchema, UserBillCreateInput } from "@/services/reimbursement.api";
import { useReimbursement } from "@/hooks/use-reimbursement"; // Assuming this exists or needs to be created
import { toast } from "sonner";

interface CreateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBillDialog({ open, onOpenChange }: CreateBillDialogProps) {
  const { createBill } = useReimbursement();
  const [images, setImages] = useState<any[]>([]); // Simplified for now

  const form = useForm<UserBillCreateInput>({
    resolver: zodResolver(userBillCreateSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
      images: [],
    },
  });

  const onSubmit = async (data: UserBillCreateInput) => {
    try {
      await createBill.mutateAsync({ ...data, images: images.map(img => img.id) });
      toast.success("Bill submitted");
      onOpenChange(false);
      form.reset();
      setImages([]);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Bill</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="amount"
            control={form.control}
            render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field }) => <Textarea {...field} />}
          />
          <Button type="submit">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
