import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dumbbell, Eye, EyeOff, Check, X, AlertCircle, Mail } from "lucide-react";
import { validatePassword, isPasswordValid } from "@/utils/passwordValidator";
import { PasswordValidationChecklist } from "@/components/auth/PasswordValidationChecklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InviteValidation {
  status: "idle" | "loading" | "valid" | "invalid";
  error?: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Invite code from URL
  const inviteCode = searchParams.get("invite");
  const [inviteValidation, setInviteValidation] = useState<InviteValidation>({ status: "idle" });

  // Validate invite code on mount
  useEffect(() => {
    if (!inviteCode) {
      setInviteValidation({ status: "idle" });
      return;
    }

    const validateInvite = async () => {
      setInviteValidation({ status: "loading" });
      
      try {
        const { data, error } = await supabase.functions.invoke("validate-coach-invite", {
          body: { code: inviteCode },
        });

        if (error) {
          console.error("[Auth] Invite validation error:", error);
          setInviteValidation({ status: "invalid", error: "Errore nella validazione dell'invito" });
          return;
        }

        if (data?.valid) {
          setInviteValidation({ status: "valid" });
          setActiveTab("signup"); // Auto-switch to signup for valid invite
        } else {
          setInviteValidation({ status: "invalid", error: data?.error || "Invito non valido" });
        }
      } catch (err) {
        console.error("[Auth] Invite validation exception:", err);
        setInviteValidation({ status: "invalid", error: "Errore di connessione" });
      }
    };

    validateInvite();
  }, [inviteCode]);

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const next = searchParams.get("next");
        navigate(next || "/", { replace: true });
      }
    });
  }, [navigate, searchParams]);

  // Password validation rules
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordIsValid = useMemo(() => isPasswordValid(passwordValidation), [passwordValidation]);

  const passwordsMatch = useMemo(() => {
    return password === confirmPassword && confirmPassword.length > 0;
  }, [password, confirmPassword]);

  const canRegister = useMemo(() => {
    return name.trim() !== "" && 
           email.trim() !== "" && 
           passwordIsValid && 
           passwordsMatch && 
           acceptedTerms &&
           inviteValidation.status === "valid";
  }, [name, email, passwordIsValid, passwordsMatch, acceptedTerms, inviteValidation.status]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode || inviteValidation.status !== "valid") {
      toast.error("Codice invito non valido");
      return;
    }
    
    setLoading(true);

    try {
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || null;

      // Use dedicated edge function for coach signup with invite code
      const { data, error } = await supabase.functions.invoke('signup-coach', {
        body: {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          invite_code: inviteCode,
        },
      });

      if (error) throw error;
      
      // Check for error in response body
      if (data?.error) {
        throw new Error(data.error);
      }
      
      // Save email for pre-filling login
      const registeredEmail = email;
      
      toast.success("Account creato con successo! Accedi per continuare.");
      
      // Reset fields (except email)
      setPassword("");
      setName("");
      setConfirmPassword("");
      setAcceptedTerms(false);
      
      // Cambia tab e mantieni l'email per facilitare il login
      setActiveTab("signin");
      setEmail(registeredEmail);
      
      // Clear invite from URL
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      const next = searchParams.get("next");
      navigate(next || "/", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'accesso");
    } finally {
      setLoading(false);
    }
  };

  // Determine if registration should be shown
  const showRegistration = inviteCode && inviteValidation.status === "valid";
  const showInviteError = inviteCode && inviteValidation.status === "invalid";
  const showInviteLoading = inviteCode && inviteValidation.status === "loading";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Icon and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-[hsl(220,70%,95%)] rounded-3xl flex items-center justify-center">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Motion</h1>
            <p className="text-muted-foreground mt-2">
              Crea e gestisci piani di allenamento professionali con l'assistenza AI
            </p>
          </div>
        </div>

        {/* Invite Loading State */}
        {showInviteLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="ml-3 text-muted-foreground">Validazione invito...</span>
          </div>
        )}

        {/* Invite Error State */}
        {showInviteError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invito non valido</AlertTitle>
            <AlertDescription className="mt-2">
              {inviteValidation.error}
              <div className="mt-3">
                <a 
                  href="mailto:support@example.com" 
                  className="text-sm underline hover:no-underline"
                >
                  Contatta l'amministratore
                </a>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Valid Invite Banner */}
        {showRegistration && (
          <Alert className="border-green-200 bg-green-50">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Registrazione su invito</AlertTitle>
            <AlertDescription className="text-green-700">
              Compila il form per creare il tuo account coach.
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Toggle - Only show if no invite or invite is valid */}
        {!showInviteLoading && !showInviteError && (
          <>
            {!showRegistration ? (
              // No invite: show only login
              <div className="bg-[hsl(220,15%,92%)] rounded-full p-1.5 flex gap-1">
                <button
                  type="button"
                  className="flex-1 py-3 px-6 rounded-full text-sm font-medium bg-card text-foreground shadow-sm"
                >
                  Accedi
                </button>
              </div>
            ) : (
              // Valid invite: show only registration
              <div className="bg-[hsl(220,15%,92%)] rounded-full p-1.5 flex gap-1">
                <button
                  type="button"
                  className="flex-1 py-3 px-6 rounded-full text-sm font-medium bg-card text-foreground shadow-sm"
                >
                  Registrati
                </button>
              </div>
            )}
          </>
        )}

        {/* Forms Container */}
        {!showInviteLoading && !showInviteError && (
          <div className="space-y-6">
            {!showRegistration ? (
              // Login Form
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email-signin" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="email-signin"
                    type="email"
                    placeholder="tuaemail@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-card border-border text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin" className="text-foreground font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password-signin"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-2xl bg-card border-border text-base pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Hai dimenticato la password?
                  </Link>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-3xl text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                  disabled={loading}
                >
                  {loading ? "Accesso in corso..." : "Accedi"}
                </Button>
              </form>
            ) : (
              // Registration Form (only with valid invite)
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name-signup" className="text-foreground font-medium">
                    Nome
                  </Label>
                  <Input
                    id="name-signup"
                    type="text"
                    placeholder="Il tuo nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-card border-border text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="tuaemail@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-card border-border text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="text-foreground font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password-signup"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-2xl bg-card border-border text-base pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  <PasswordValidationChecklist validation={passwordValidation} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password-signup" className="text-foreground font-medium">
                    Conferma Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password-signup"
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

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-tight cursor-pointer"
                  >
                    Accetto i{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Termini e Condizioni
                    </a>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-3xl text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                  disabled={loading || !canRegister}
                >
                  {loading ? "Registrazione in corso..." : "Registrati"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
