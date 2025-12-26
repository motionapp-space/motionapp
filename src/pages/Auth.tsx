import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dumbbell, Eye, EyeOff, Check, X } from "lucide-react";
import { validatePassword, isPasswordValid } from "@/utils/passwordValidator";
import { PasswordValidationChecklist } from "@/components/auth/PasswordValidationChecklist";

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
           acceptedTerms;
  }, [name, email, passwordIsValid, passwordsMatch, acceptedTerms]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      
      // Salva l'email per pre-popolarla nella tab login
      const registeredEmail = email;
      
      toast.success("Account creato con successo! Accedi per continuare.");
      
      // Reset campi (tranne email)
      setPassword("");
      setName("");
      setConfirmPassword("");
      setAcceptedTerms(false);
      
      // Cambia tab e mantieni l'email per facilitare il login
      setActiveTab("signin");
      setEmail(registeredEmail);
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

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(0,0%,96%)] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Icon and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-[hsl(220,70%,95%)] rounded-3xl flex items-center justify-center">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Studio AI</h1>
            <p className="text-muted-foreground mt-2">
              Crea e gestisci piani di allenamento professionali con l'assistenza AI
            </p>
          </div>
        </div>

        {/* Custom Tab Toggle */}
        <div className="bg-[hsl(220,15%,92%)] rounded-full p-1.5 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all ${
              activeTab === "signin"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all ${
              activeTab === "signup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Forms Container */}
        <div className="space-y-6">{activeTab === "signin" ? (

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
      </div>
    </div>
  );
};

export default Auth;