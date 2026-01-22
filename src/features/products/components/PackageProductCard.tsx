import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Pencil, Copy, EyeOff, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "../types";
import { formatCurrency } from "@/features/packages/utils/kpi";

interface PackageProductCardProps {
  product: Product;
  singleSessionPrice: number;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onToggleVisibility: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function PackageProductCard({
  product,
  singleSessionPrice,
  onEdit,
  onDuplicate,
  onToggleVisibility,
  onDelete,
}: PackageProductCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pricePerSession = product.price_cents / product.credits_amount;
  const expectedPrice = singleSessionPrice * product.credits_amount;
  const discountPercent = expectedPrice > 0 
    ? Math.round(((expectedPrice - product.price_cents) / expectedPrice) * 100) 
    : 0;

  const durationLabel = product.duration_months === 1 
    ? "1 mese" 
    : `${product.duration_months} mesi`;

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`transition-all ${isDragging ? "opacity-50 shadow-lg" : ""} ${!product.is_active ? "opacity-60" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{product.name}</h4>
                {!product.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Inattivo
                  </Badge>
                )}
                {product.is_active && !product.is_visible && (
                  <Badge variant="outline" className="text-xs">
                    Nascosto
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span className="font-medium text-foreground">
                  {formatCurrency(product.price_cents)}
                </span>
                <span>•</span>
                <span>{formatCurrency(pricePerSession)}/sessione</span>
                {discountPercent > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-medium">
                      -{discountPercent}%
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{durationLabel}</span>
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(product)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleVisibility(product)}>
                  {product.is_visible ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Nascondi
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Mostra
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(product)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
