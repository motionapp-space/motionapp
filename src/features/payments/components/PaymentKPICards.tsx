import { motion } from "framer-motion";
import { Wallet, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function formatEur(cents: number) {
  return (cents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

interface Props {
  totalDue: number;
  paidThisMonth: number;
  draftCount: number;
}

const cards = [
  {
    key: "due",
    label: "Da Incassare",
    Icon: Wallet,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    getValue: (p: Props) => formatEur(p.totalDue),
  },
  {
    key: "paid",
    label: "Incassato Mese",
    Icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    getValue: (p: Props) => formatEur(p.paidThisMonth),
  },
  {
    key: "draft",
    label: "In Attesa",
    Icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    getValue: (p: Props) => String(p.draftCount),
  },
] as const;

export function PaymentKPICards(props: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.35, ease: "easeOut" }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${c.color}`}>
                    {c.getValue(props)}
                  </p>
                </div>
                <div className={`rounded-full p-2.5 ${c.bgColor}`}>
                  <c.Icon className={`h-5 w-5 ${c.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
