import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBalanceEnquiry } from "@/services/reimbursement.api";
import { useQuery } from "@tanstack/react-query";

export function BalanceCard() {
  const { data: balance, isLoading } = useQuery({
    queryKey: ["reimbursement", "balance"],
    queryFn: getBalanceEnquiry,
  });

  if (isLoading) return <Card>Loading balance...</Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reimbursement Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{balance?.Total ?? "0"}</p>
      </CardContent>
    </Card>
  );
}
