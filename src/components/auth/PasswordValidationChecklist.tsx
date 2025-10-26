import { Check, X } from "lucide-react";
import { PasswordValidation } from "@/utils/passwordValidator";

interface PasswordValidationChecklistProps {
  validation: PasswordValidation;
}

export const PasswordValidationChecklist = ({ validation }: PasswordValidationChecklistProps) => {
  return (
    <div className="mt-3 space-y-1.5 text-sm">
      <p className="font-medium text-muted-foreground mb-2">La password deve contenere:</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {validation.minLength ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <X className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={validation.minLength ? "text-green-600" : "text-muted-foreground"}>
            Almeno 8 caratteri
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validation.hasUppercase ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <X className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={validation.hasUppercase ? "text-green-600" : "text-muted-foreground"}>
            Almeno una lettera maiuscola
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validation.hasLowercase ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <X className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={validation.hasLowercase ? "text-green-600" : "text-muted-foreground"}>
            Almeno una lettera minuscola
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validation.hasNumber ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <X className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={validation.hasNumber ? "text-green-600" : "text-muted-foreground"}>
            Almeno un numero
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validation.hasSpecial ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <X className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={validation.hasSpecial ? "text-green-600" : "text-muted-foreground"}>
            Almeno un carattere speciale (!@#$%^&*...)
          </span>
        </div>
      </div>
    </div>
  );
};
