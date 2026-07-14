"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";

import { Badge } from "@/components/ui/badge";

import { LeaveBalanceItem } from "@/services/leave.api";

type Props = {
  title: string;
  balance: LeaveBalanceItem;
};

export default function LeaveBalanceCard({ title, balance }: Props) {
  const total = balance.used + balance.remaining;

  const progress = total === 0 ? 0 : (balance.used / total) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="capitalize">{title}</CardTitle>

          <Badge variant="secondary">{balance.remaining} Left</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={progress} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Used</p>

            <p className="text-2xl font-bold">{balance.used}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>

            <p className="text-2xl font-bold">{balance.remaining}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
