import { getTodayView } from "@/db/queries";
import { PageHeader } from "@/components/layout/page-header";
import { TaskList } from "@/components/tasks/task-list";
import { todayISO } from "@/lib/dates";

export default async function TodayPage() {
  const v = await getTodayView();
  const minutes = v.today.reduce((sum, t) => sum + (t.estimateMinutes ?? 0), 0);

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" })}
        title="Aujourd'hui"
        description={
          `${v.today.length} tâche${v.today.length > 1 ? "s" : ""} prévue${v.today.length > 1 ? "s" : ""}` +
          (minutes ? ` · environ ${Math.round((minutes / 60) * 10) / 10} h` : "") +
          (v.overdue.length ? ` · ${v.overdue.length} en retard` : "")
        }
      />
      <TaskList
        addDefaults={{ scheduledDate: todayISO() }}
        addPlaceholder="Ajouter pour aujourd'hui…  (!haute, #tag, +projet)"
        sections={[
          { title: "En retard", tasks: v.overdue, tone: "danger" },
          { title: "Aujourd'hui", tasks: v.today, emptyText: "Rien de prévu aujourd'hui. Pioche dans « À planifier » 👇" },
          { title: "7 prochains jours", tasks: v.upcoming },
          { title: "À planifier (sans date)", tasks: v.unscheduled },
          { title: "Terminées aujourd'hui", tasks: v.doneToday, tone: "muted" },
        ]}
      />
    </div>
  );
}
