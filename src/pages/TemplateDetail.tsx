import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTemplate } from "@/features/templates/hooks/useTemplate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { toSentenceCase } from "@/lib/text";

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  
  // Support both mode=read/edit and backward compatibility with readonly=1
  const readonly = sp.get("readonly") === "1" || sp.get("readonly") === "true";
  const modeParam = sp.get("mode");
  const mode = (readonly ? "read" : (modeParam ?? "read")) as "read" | "edit";
  
  const { data, isError, error, isLoading } = useTemplate(id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (isError && (error as any)?.code === "PGRST116") {
    // Template not found - redirect to missing page
    navigate(`/templates/${id}/missing`, { replace: true });
    return null;
  }

  if (!data) {
    return null;
  }

  const toEdit = () => {
    setSp({ mode: "edit" }, { replace: true });
  };

  const toRead = () => {
    setSp({ mode: "read" }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <PageHeading className="text-2xl">{data.name}</PageHeading>
              {mode === "read" && (
                <p className="text-sm text-muted-foreground mt-1">
                  {toSentenceCase("Visualizzazione in sola lettura")}
                </p>
              )}
            </div>
          </div>
          {mode === "read" ? (
            <Button onClick={toEdit} data-testid="btn-edit-template">
              {toSentenceCase("Modifica")}
            </Button>
          ) : (
            <Button variant="outline" onClick={toRead} data-testid="btn-cancel-edit">
              {toSentenceCase("Chiudi")}
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        {data.description && (
          <p className="text-muted-foreground mb-6">{data.description}</p>
        )}
        
        {data.category && (
          <div className="mb-6">
            <span className="text-sm text-muted-foreground">{toSentenceCase("Categoria")}: </span>
            <span className="text-sm font-medium">{data.category}</span>
          </div>
        )}

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">{toSentenceCase("Anteprima struttura")}</h3>
          <pre className="text-xs overflow-auto p-4 bg-muted rounded">
            {JSON.stringify(data.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
