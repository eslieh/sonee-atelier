"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, AlertCircle, LogIn, Eye, EyeOff } from "lucide-react";
import { loginAction, loginWithGoogleAction } from "@/app/admin/actions";

type LoginState = {
  error?: string;
  success?: boolean;
};

import styles from "./AuthForm.module.css";

const initialState: LoginState = { error: "", success: false };

type LoginFormProps = {
  initialServerError?: string;
};

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
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <LogIn className={styles.buttonIcon} size={18} />
          <span>Enter studio</span>
        </>
      )}
    </motion.button>
  );
}

export function LoginForm({ initialServerError }: LoginFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const errorMessage = state.error || initialServerError;
  const { pending } = useFormStatus();

  // Reset form only on successful login
  if (state.success && formRef.current) {
    formRef.current.reset();
  }

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
            aria-invalid={errorMessage ? "true" : "false"}
            aria-describedby={errorMessage ? "email-error" : undefined}
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
            placeholder="••••••••"
            required
            autoComplete="current-password"
            aria-invalid={errorMessage ? "true" : "false"}
            aria-describedby={errorMessage ? "password-error" : undefined}
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
      </label>
      {errorMessage && (
        <motion.div
          className={styles.error}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className={styles.errorIcon} size={16} />
          <span>{errorMessage}</span>
        </motion.div>
      )}
      <SubmitButton pending={pending} />
      <p className={styles.divider}>or</p>
      <motion.button
        className={styles.googleButton}
        type="submit"
        formAction={loginWithGoogleAction}
        formMethod="post"
        formNoValidate
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg className={styles.googleIcon} width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
          />
        </svg>
        <span>Continue with Google</span>
      </motion.button>
    </motion.form>
  );
}

