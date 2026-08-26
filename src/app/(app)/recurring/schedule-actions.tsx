"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleScheduleActive, deleteSchedule, runScheduleNow } from "@/lib/actions/recurring";

export function ScheduleActions({ scheduleId, active }: { scheduleId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center justify-end gap-3 text-xs">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await runScheduleNow(scheduleId);
            toast.success("Invoice generated from schedule");
            router.refresh();
          })
        }
        className="text-gray-700 hover:underline disabled:opacity-50"
      >
        Run now
      </button>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await toggleScheduleActive(scheduleId, !active);
            toast.success(active ? "Schedule paused" : "Schedule resumed");
            router.refresh();
          })
        }
        className="text-gray-700 hover:underline disabled:opacity-50"
      >
        {active ? "Pause" : "Resume"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this schedule?")) {
            toast.success("Schedule deleted");
            startTransition(() => deleteSchedule(scheduleId));
          }
        }}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
