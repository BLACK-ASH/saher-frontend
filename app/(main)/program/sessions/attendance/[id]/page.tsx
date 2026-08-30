"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePrograms } from "@/hooks/use-programs";
import { useSessions } from "@/hooks/use-sessions";
import { computeAttendanceDiff } from "@/lib/attendance-diff";
import { SingleParticipantT } from "@/services/program.api";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function SessionAttendancePage() {
  const { id } = useParams<{ id: string }>(); // session id
  const router = useRouter();
  const queryClient = useQueryClient();

  const { session, markAttendance, deleteAttendance } = useSessions({ id });
  const { program } = usePrograms({ id: session.data?.program?.id });

  // Full roster (populated) from program detail; attended ids from session detail.
  const roster = (program.data as SingleParticipantT | undefined)?.participants ?? [];
  const attendedIds = useMemo(
    () => session.data?.participants?.map((p) => p.id) ?? [],
    [session.data],
  );

  // Checked state is local-only until saved (no server round-trip per toggle).
  // Seed once per session id via render-phase adjustment (D-23 — no
  // setState-in-effect) so refetches never clobber user edits.
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [seededId, setSeededId] = useState<string | null>(null);

  if (session.data && session.data.id !== seededId) {
    setSeededId(session.data.id);
    setChecked(new Set(attendedIds));
  }

  const diff = useMemo(
    () => computeAttendanceDiff(attendedIds, [...checked]),
    [attendedIds, checked],
  );
  const dirtyCount = diff.added.length + diff.removed.length;

  const [saving, setSaving] = useState(false);

  const toggle = (participantId: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(participantId)) next.delete(participantId);
      else next.add(participantId);
      return next;
    });
  };

  const onSave = async () => {
    if (!session.data || !dirtyCount) return;
    setSaving(true);
    let saved = 0;
    const total = (diff.added.length ? 1 : 0) + (diff.removed.length ? 1 : 0);
    try {
      // Sequential bulk playout — ONE POST for additions, ONE DELETE for removals.
      if (diff.added.length) {
        await markAttendance.mutateAsync({
          id: session.data.id,
          data: { participantIds: diff.added },
        });
        saved += 1;
      }
      if (diff.removed.length) {
        await deleteAttendance.mutateAsync({
          id: session.data.id,
          data: { participantIds: diff.removed },
        });
        saved += 1;
      }
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Attendance saved");
    } catch {
      // apiFetch already toasts the underlying error; report the partial state.
      toast.error(
        saved === 0
          ? "Attendance could not be saved."
          : `Attendance partially saved (${saved} of ${total} updates) — please review and save again.`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (session.isLoading || program.isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session.data || !program.data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        Unable to load attendance.
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-12 p-4">
      <Button
        variant="ghost"
        className="my-6 gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Attendance</h1>
          <p className="text-muted-foreground">{session.data.title}</p>
        </div>

        <Badge variant="secondary">
          {checked.size} / {roster.length} Present
        </Badge>
      </div>

      {roster.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground">
            No participants on this session&apos;s roster — add participants to
            the program first.
          </p>
          <Button asChild variant="outline">
            <Link href={`/program/${session.data.program.id}`}>
              Add participants to the program
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-11" />
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Affiliation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((participant, index) => {
                const isPresent = checked.has(participant.id);
                return (
                  <TableRow
                    key={participant.id}
                    className={`cursor-pointer ${
                      index % 2 ? "bg-muted/40" : ""
                    }`}
                    onClick={() => toggle(participant.id)}
                  >
                    {/* 44px interactive hit-area for the checkbox cell */}
                    <TableCell className="w-11 p-0 text-center">
                      <span className="mx-auto flex h-11 w-11 items-center justify-center">
                        <Checkbox checked={isPresent} />
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {participant.name}
                    </TableCell>
                    <TableCell>{participant.phoneNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {participant.affiliation}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {roster.length} participants
              {dirtyCount > 0 && (
                <span className="ml-2 font-medium text-primary">
                  {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setChecked(new Set(roster.map((p) => p.id)))}
              >
                Mark All
              </Button>
              <Button
                variant="outline"
                onClick={() => setChecked(new Set())}
              >
                Clear All
              </Button>
              <Button
                onClick={onSave}
                disabled={saving || dirtyCount === 0}
              >
                {saving ? "Saving…" : "Save Attendance"}
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}