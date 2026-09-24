import { useEffect, useRef, useState } from "react";
import { STRINGS } from "../lib/strings.ts";
import Icon, { type IconName } from "./Icon.tsx";

const FEEDBACK_MS = 2000;

interface CopyButtonProps {
  label: string;
  icon: IconName;
  /** The text to copy; null disables the button (no valid range yet). */
  text: string | null;
  variant: "primary" | "tonal";
  describedBy?: string;
  onResult: (copied: boolean, text: string) => void;
}

export default function CopyButton({
  label,
  icon,
  text,
  variant,
  describedBy,
  onResult,
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    if (text === null) return;
    let copied = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      copied = false;
    }
    // The panel may have closed while the clipboard was busy.
    if (!mounted.current) return;
    setStatus(copied ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
    onResult(copied, text);
  }

  const shown =
    status === "copied"
      ? { icon: "check" as const, label: STRINGS.panel.copied }
      : { icon, label: status === "failed" ? STRINGS.panel.copyFailed : label };

  return (
    <button
      type="button"
      className={variant}
      // Focusable while unavailable, so keyboard users can find it before entering times.
      aria-disabled={text === null}
      aria-describedby={describedBy}
      onClick={copy}
    >
      <Icon name={shown.icon} />
      {shown.label}
    </button>
  );
}
