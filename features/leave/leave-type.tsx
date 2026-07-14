"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Plus, Pencil } from "lucide-react";

import { useLeave } from "@/hooks/use-leave";

import { LeaveTypeT } from "@/services/leave.api";
import LeaveTypeDialog from "./leave-type-dialog";

export default function LeaveTypePage() {
  const { leaveTypes } = useLeave();

  const [selected, setSelected] = useState<LeaveTypeT>();

  const [open, setOpen] = useState(false);

  return (
    <div className="container space-y-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leave Types</h1>

          <p className="text-muted-foreground">
            Configure organisation leave policies.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelected(undefined);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Leave Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Leave Types</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>

                <TableHead>Code</TableHead>

                <TableHead>Days</TableHead>

                <TableHead>Carry Forward</TableHead>

                <TableHead>Proof</TableHead>

                <TableHead>Status</TableHead>

                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {leaveTypes.data?.map((type) => (
                <TableRow key={type.code}>
                  <TableCell>{type.name}</TableCell>

                  <TableCell>{type.code}</TableCell>

                  <TableCell>{type.allocatedDays}</TableCell>

                  <TableCell>{type.maxCarryForwardDays}</TableCell>

                  <TableCell>
                    {type.requiresProof ? "Required" : "No"}
                  </TableCell>

                  <TableCell>{type.isActive ? "Active" : "Disabled"}</TableCell>

                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelected(type);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LeaveTypeDialog
        open={open}
        onOpenChange={setOpen}
        leaveType={selected}
      />
    </div>
  );
}
