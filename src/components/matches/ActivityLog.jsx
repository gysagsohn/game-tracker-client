// src/components/matches/ActivityLog.jsx
import { FaBell, FaEdit, FaHistory, FaPlus, FaUserCheck } from "react-icons/fa";

function fmt(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function nameOf(u) {
  if (!u) return "Someone";
  const first = u.firstName || "";
  const last = u.lastName || "";
  const nn = `${first} ${last}`.trim();
  return nn || u.email || "Someone";
}

export default function ActivityLog({ session }) {
  if (!session) return null;

  const events = [];

  // Created
  if (session.createdAt) {
    events.push({
      ts: session.createdAt,
      icon: <FaPlus />,
      title: "Match created",
      by: session.createdBy ? nameOf(session.createdBy) : undefined,
    });
  }

  // Updated (only if actually later than created)
  if (session.updatedAt && session.updatedAt !== session.createdAt) {
    events.push({
      ts: session.updatedAt,
      icon: <FaEdit />,
      title: "Match updated",
      by: session.lastEditedBy ? nameOf(session.lastEditedBy) : undefined,
    });
  }

  // Player confirmations
  (session.players || []).forEach((p) => {
    if (p.confirmed && p.confirmedAt) {
      events.push({
        ts: p.confirmedAt,
        icon: <FaUserCheck />,
        title: `${p.name || nameOf(p.user)} confirmed${p.result ? ` (${p.result})` : ""}`,
      });
    }
  });

  // Reminder
  if (session.lastReminderSent) {
    events.push({
      ts: session.lastReminderSent,
      icon: <FaBell />,
      title: "Reminder email sent to unconfirmed players",
    });
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.ts) - new Date(a.ts));

  if (events.length === 0) return null;

  return (
    <div className="bg-card rounded-[var(--radius-standard)] shadow-card border border-[--color-border-muted]/60 p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <FaHistory className="icon-secondary" /> Activity
      </h3>

      <ol className="space-y-3">
        {events.map((e, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="icon-secondary mt-0.5">{e.icon}</div>
            <div className="text-sm">
              <div className="font-medium">{e.title}</div>
              <div className="text-secondary text-xs">
                {fmt(e.ts)}
                {e.by ? ` • by ${e.by}` : ""}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
