import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validatePassword, isPasswordValid } from "@/utils/passwordValidator";
import { PasswordValidationChecklist } from "@/components/auth/PasswordValidationChecklist";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid recovery session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        setIsValidSession(false);
      } else {
        setIsValidSession(true);
      }
    });
  }, []);

  const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);
  const passwordIsValid = useMemo(() => isPasswordValid(passwordValidation), [passwordValidation]);
  
  const passwordsMatch = useMemo(() => {
    return newPassword === confirmPassword && confirmPassword.length > 0;
  }, [newPassword, confirmPassword]);

  const canSubmit = useMemo(() => {
    return passwordIsValid && passwordsMatch;
  }, [passwordIsValid, passwordsMatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
      setSuccess(true);
      toast.success("Password aggiornata con successo!");
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'aggiornamento della password");
      console.error("Password update error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Invalid or expired token
  if (isValidSession === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Questo link non è più valido</h1>
              <p className="text-muted-foreground mt-2">
                Il link di reset è scaduto o non è valido. Richiedi un nuovo link.
              </p>
            </div>
          </div>
          <Button 
            asChild 
            className="w-full h-14 rounded-3xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Link to="/forgot-password">Richiedi nuovo link</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-3xl flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Password aggiornata</h1>
              <p className="text-muted-foreground mt-2">
                Ora puoi accedere con la tua nuova password.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate("/auth")} 
            className="w-full h-14 rounded-3xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Vai al login
          </Button>
        </div>
      </div>
    );
  }

  // Loading session check
  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
        <div className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifica in corso...</p>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-[hsl(220,70%,95%)] rounded-3xl flex items-center justify-center">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Imposta nuova password</h1>
            <p className="text-muted-foreground mt-2">
              Inserisci la tua nuova password per completare il reset.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-foreground font-medium">
              Nuova password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-12 rounded-2xl bg-card border-border text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            <PasswordValidationChecklist validation={passwordValidation} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-foreground font-medium">
              Conferma password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 rounded-2xl bg-card border-border text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 text-sm mt-1">
                {passwordsMatch ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600">Le password corrispondono</span>
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive">Le password non corrispondono</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-3xl text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
            disabled={loading || !canSubmit}
          >
            {loading ? "Salvataggio in corso..." : "Imposta nuova password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
