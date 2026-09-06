// Maps backend report-queue responses to user-facing toast text. The queue is
// either processing, already done (reuse), or newly started — each needs its own
// message so a click never silently does nothing.
export const describeExportMessage = (
  message: string,
): { kind: "info" | "success"; text: string } => {
  if (/processing/i.test(message)) {
    return {
      kind: "info",
      text: "Report is already being generated — you'll be notified when it's ready.",
    };
  }
  if (/already generated/i.test(message)) {
    return {
      kind: "info",
      text: "A report already exists for this request — check notifications for the download.",
    };
  }
  return {
    kind: "success",
    text: "Report generation started — you'll be notified when it's ready for download.",
  };
};

export const toastExportMessage = (
  message: string,
  toast: { info: (m: string) => void; success: (m: string) => void },
) => {
  const { kind, text } = describeExportMessage(message);
  if (kind === "info") toast.info(text);
  else toast.success(text);
};