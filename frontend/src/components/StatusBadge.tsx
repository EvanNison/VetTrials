const STATUS_STYLES: Record<string, string> = {
  recruiting: "bg-success/10 text-success border-success/20",
  enrolled: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-muted/10 text-muted border-muted/20",
  suspended: "bg-danger/10 text-danger border-danger/20",
  removed: "bg-danger/10 text-danger border-danger/20",
  unknown: "bg-neutral/10 text-neutral border-neutral/20",
};

const STATUS_LABELS: Record<string, string> = {
  recruiting: "Recruiting",
  enrolled: "Enrolled",
  completed: "Completed",
  suspended: "Suspended",
  removed: "Removed",
  unknown: "Unknown",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.unknown;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "recruiting"
            ? "bg-success"
            : status === "enrolled"
            ? "bg-warning"
            : status === "suspended" || status === "removed"
            ? "bg-danger"
            : "bg-neutral"
        }`}
      />
      {label}
    </span>
  );
}
