"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Loader2, AlertCircle, UserPlus, CheckCircle2, Eye, EyeOff } from "lucide-react";

import { signupAction } from "@/app/admin/actions";

import styles from "./AuthForm.module.css";

type SignupState = {
  error?: string;
  success?: boolean;
};

const initialState: SignupState = { error: "", success: false };

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <motion.button
      type="submit"
      className={styles.submitButton}
      disabled={pending}
      whileHover={{ scale: pending ? 1 : 1.02 }}
      whileTap={{ scale: pending ? 1 : 0.98 }}
    >
      {pending ? (
        <>
          <Loader2 className={styles.buttonIcon} size={18} />
          <span>Creating account...</span>
        </>
      ) : (
        <>
          <UserPlus className={styles.buttonIcon} size={18} />
          <span>Create account</span>
        </>
      )}
    </motion.button>
  );
}

export function SignupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<SignupState, FormData>(
    signupAction as (state: SignupState, formData: FormData) => Promise<SignupState>,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const { pending } = useFormStatus();

  // Reset form only on successful signup
  if (state.success && formRef.current) {
    formRef.current.reset();
    setPassword("");
  }

  const passwordStrength = password.length >= 8;
  const hasMinLength = password.length >= 8;

  return (
    <motion.form
      ref={formRef}
      className={styles.form}
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <label className={styles.label}>
        <span className={styles.labelText}>Name</span>
        <div className={styles.inputWrapper}>
          <User className={styles.inputIcon} size={18} />
          <input
            className={styles.input}
            name="name"
            type="text"
            placeholder="Creative director"
            required
            autoComplete="name"
            aria-invalid={state.error ? "true" : "false"}
          />
        </div>
      </label>
      <label className={styles.label}>
        <span className={styles.labelText}>Email</span>
        <div className={styles.inputWrapper}>
          <Mail className={styles.inputIcon} size={18} />
          <input
            className={styles.input}
            name="email"
            type="email"
            placeholder="studio@sonie-atelier.com"
            required
            autoComplete="email"
            aria-invalid={state.error ? "true" : "false"}
          />
        </div>
      </label>
      <label className={styles.label}>
        <span className={styles.labelText}>Password</span>
        <div className={styles.inputWrapper}>
          <Lock className={styles.inputIcon} size={18} />
          <input
            className={styles.input}
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={state.error ? "true" : "false"}
            aria-describedby="password-requirements"
          />
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {password && (
          <div id="password-requirements" className={styles.passwordRequirements}>
            <div className={styles.requirement}>
              {hasMinLength ? (
                <CheckCircle2 className={styles.checkIcon} size={14} />
              ) : (
                <div className={styles.checkIconPlaceholder} />
              )}
              <span className={hasMinLength ? styles.requirementMet : ""}>At least 8 characters</span>
            </div>
          </div>
        )}
      </label>
      {state.error && (
        <motion.div
          className={styles.error}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className={styles.errorIcon} size={16} />
          <span>{state.error}</span>
        </motion.div>
      )}
      {state.success && (
        <motion.div
          className={styles.success}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className={styles.successIcon} size={16} />
          <span>Account created successfully! Redirecting...</span>
        </motion.div>
      )}
      <SubmitButton pending={pending} />
    </motion.form>
  );
}

