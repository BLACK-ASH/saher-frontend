"use client";

// Masking util (ADMN-04, T-06-02-01): full accountNumber arrives unmasked on
// every account/bank read. Apply maskAccount to EVERY non-editing render; the
// raw value appears only inside the bank edit input.
export const maskAccount = (num: string): string =>
  num.length > 4 ? `•••• ${num.slice(-4)}` : "••••";

// Bank create/edit form — fleshed out in plan task 3.
export const BankDetailForm = () => null;
