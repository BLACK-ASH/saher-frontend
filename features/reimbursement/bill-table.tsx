import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BillResponse } from "@/services/reimbursement.api";
import { BillStatusBadge } from "./bill-status-badge";
import { Button } from "@/components/ui/button";

interface BillTableProps {
  bills: BillResponse[];
  onView: (bill: BillResponse) => void;
  onEdit?: (bill: BillResponse) => void;
  onWithdraw?: (bill: BillResponse) => void;
  onRestore?: (bill: BillResponse) => void;
  showActions?: boolean;
}

export function BillTable({ bills, onView, onEdit, onWithdraw, onRestore, showActions = true }: BillTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <TableRow key={bill.id}>
            <TableCell>{bill.description}</TableCell>
            <TableCell>₹{(bill.amount || bill.advance).toLocaleString("en-IN")}</TableCell>
            <TableCell>
              <BillStatusBadge status={bill.status} />
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onView(bill)}>View</Button>
              {showActions && bill.status === "pending" && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onEdit?.(bill)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => onWithdraw?.(bill)}>Withdraw</Button>
                </>
              )}
              {onRestore && bill.isDeleted && (
                <Button variant="ghost" size="sm" onClick={() => onRestore(bill)}>Restore</Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
