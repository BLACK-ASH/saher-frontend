import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBalanceEnquiry } from "@/services/reimbursement.api";
import { useQuery } from "@tanstack/react-query";

export const BalanceCard = () => {
  const { data: balance, isLoading } = useQuery({
    queryKey: ["reimbursement", "balance"],
    queryFn: getBalanceEnquiry,
  });

  if (isLoading) return <div>Loading...</div>;
  if (!balance) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{balance.Total}</p>
      </CardContent>
    </Card>
  );
};
