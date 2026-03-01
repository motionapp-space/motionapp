import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminFeedback } from "../api/feedback.api";

interface Props {
  feedback: AdminFeedback[];
}

const typeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bug: "destructive",
  suggestion: "secondary",
  other: "outline",
};

export function FeedbackTable({ feedback }: Props) {
  if (feedback.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Nessun feedback ricevuto.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Sezione</TableHead>
          <TableHead>Pagina</TableHead>
          <TableHead className="min-w-[200px]">Messaggio</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {feedback.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="whitespace-nowrap text-xs">
              {format(new Date(f.created_at), "dd MMM yyyy HH:mm", { locale: it })}
            </TableCell>
            <TableCell className="text-xs">{f.user_email}</TableCell>
            <TableCell>
              <Badge variant={typeVariant[f.type] ?? "outline"} className="text-xs">
                {f.type}
              </Badge>
            </TableCell>
            <TableCell className="text-xs">{f.section ?? "—"}</TableCell>
            <TableCell className="text-xs font-mono">{f.page}</TableCell>
            <TableCell className="text-sm max-w-xs truncate">{f.message}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">{f.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
