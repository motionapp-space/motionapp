import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, UploadCloud, File as FileIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Plan } from "@/types/plan";

/** Convert a File to a Base64 string (without the data URI prefix). */
function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (err) => reject(err);
  });
}

interface MagicImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (plan: Plan) => void;
}

export function MagicImportModal({ open, onOpenChange, onSuccess }: MagicImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadingMessages = [
    "Leggendo il documento...",
    "Identificando gli esercizi...",
    "Estraendo le serie e le ripetizioni...",
    "Strutturando il piano di allenamento...",
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"]
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
  });

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setLoadingStep(0);

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const base64File = await fileToBase64(file);

      const { data, error: functionError } = await supabase.functions.invoke("parse-training-plan", {
        body: {
          fileContent: base64File,
          mimeType: file.type,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || "Errore durante l'elaborazione");
      }

      if (!data || !data.days) {
        throw new Error("L'AI non è riuscita a estrarre una struttura valida.");
      }

      onSuccess(data as Plan);
      
      // We don't close here, we wait for the parent to take action or show preview
    } catch (err: any) {
      console.error("Magic Import Error:", err);
      setError(err.message || "Si è verificato un errore inaspettato.");
      toast.error("Errore di importazione");
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!isProcessing) {
        onOpenChange(v);
        // Reset state on close
        if (!v) setTimeout(handleReset, 300);
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importazione Magica AI
          </DialogTitle>
          <DialogDescription>
            Carica un PDF, uno screenshot o un foglio Excel del tuo vecchio piano. L'Intelligenza Artificiale lo trasformerà in un piano strutturato per Motion.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {!isProcessing && !error ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">
                      {isDragActive ? "Rilascia il file qui..." : "Trascina un file qui, o clicca per sfogliare"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supporta PDF, immagini (JPG, PNG) e fogli di calcolo (XLSX, CSV) fino a 5MB.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-xl p-4 flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <FileIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      Cambia
                    </Button>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
                  <Button 
                    disabled={!file} 
                    onClick={handleProcess}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Genera Piano
                  </Button>
                </div>
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-6">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-8 w-8 text-primary animate-bounce" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-2">La Magia è in corso...</h3>
                <motion.p 
                  key={loadingStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-muted-foreground h-5"
                >
                  {loadingMessages[loadingStep]}
                </motion.p>
              </motion.div>
            ) : (
               <motion.div
                 key="error"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="py-8 flex flex-col items-center justify-center text-center space-y-4"
               >
                 <div className="bg-destructive/10 p-4 rounded-full">
                   <AlertCircle className="h-8 w-8 text-destructive" />
                 </div>
                 <div>
                   <h3 className="text-lg font-medium">Ops, qualcosa è andato storto</h3>
                   <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{error}</p>
                 </div>
                 <div className="pt-4 flex gap-3">
                   <Button variant="outline" onClick={() => onOpenChange(false)}>Chiudi</Button>
                   <Button onClick={handleReset}>Riprova</Button>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
