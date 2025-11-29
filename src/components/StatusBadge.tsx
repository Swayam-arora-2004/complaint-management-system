import { Badge } from "@/components/ui/badge";

type Status = "new" | "in-progress" | "resolved" | "closed";

interface StatusBadgeProps {
  status: Status;
}

const statusConfig = {
  "new": {
    label: "New",
    className: "bg-status-new text-white",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-status-progress text-foreground",
  },
  "resolved": {
    label: "Resolved",
    className: "bg-status-resolved text-white",
  },
  "closed": {
    label: "Closed",
    className: "bg-status-closed text-white",
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge className={`rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
};
