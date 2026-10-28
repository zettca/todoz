import { useId, type ReactNode, type RefObject } from "react";

/**
 * A native `<dialog>` wrapping a `<form
        method="dialog"
        onSubmit={(e) => {
          const { submitter } = e.nativeEvent as SubmitEvent;
          const value = submitter instanceof HTMLButtonElement ? submitter.value : "";
          if (value) onSubmit(value);
        }}
      >`.
 * `onSubmit` receives the value of the submitting button; `onClose` fires when dismissed
 * without a value (Esc, click-away, or a button with an empty value).
 */
export default function DialogForm({
  dialogRef,
  title,
  description,
  onSubmit,
  onClose,
  children,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  description?: string;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const descId = useId();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="m-auto w-full max-w-sm rounded-2xl border border-line bg-surface p-5 text-ink shadow-lg backdrop:bg-black/40"
      onClose={(e) => {
        const { returnValue } = e.currentTarget;
        e.currentTarget.returnValue = "";
        if (!returnValue) onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
    >
      <form
        action={(data) => {
          dialogRef.current?.close("submitted");
          onSubmit(data);
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-1 text-sm text-muted">
            {description}
          </p>
        )}
        {children}
      </form>
    </dialog>
  );
}
