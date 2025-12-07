"use client";

import { useActionState, useRef, useEffect } from "react";
import { updateSettingsAction } from "@/app/admin/actions";
import styles from "./WhatsAppNumberForm.module.css";

type WhatsAppNumberFormProps = {
  initialValue?: string | null;
};

const initialState = { error: undefined, success: undefined };

export function WhatsAppNumberForm({ initialValue }: WhatsAppNumberFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(updateSettingsAction, initialState);

  // Reset form on success
  useEffect(() => {
    if (state.success && formRef.current) {
      // Reload the page to show updated value
      window.location.reload();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      <div className={styles.inputGroup}>
        <label className={styles.label} htmlFor="whatsapp_number">
          WhatsApp Number
        </label>
        <input
          id="whatsapp_number"
          name="whatsapp_number"
          type="text"
          placeholder="+1234567890"
          defaultValue={initialValue ?? ""}
          className={styles.input}
        />
        <p className={styles.helpText}>
          Enter your WhatsApp number including country code (e.g., +1234567890)
        </p>
      </div>
      {state.error && <p className={styles.error}>{state.error}</p>}
      {state.success && <p className={styles.success}>WhatsApp number updated successfully!</p>}
      <button type="submit" className={styles.submitButton}>
        Save Changes
      </button>
    </form>
  );
}

