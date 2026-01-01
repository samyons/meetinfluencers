import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface ScrapeStatusBadgeProps {
  status: "success" | "partial" | "failed";
}

export function ScrapeStatusBadge({ status }: ScrapeStatusBadgeProps) {
  const config = {
    success: {
      icon: CheckCircle,
      label: "Succès",
      className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    },
    partial: {
      icon: AlertCircle,
      label: "Partiel",
      className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
    },
    failed: {
      icon: XCircle,
      label: "Échec",
      className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
