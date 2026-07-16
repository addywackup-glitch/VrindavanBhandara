"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";
import { BOOKING_STATUS_LABELS, DESTRUCTIVE_STATUSES } from "@/lib/booking-transitions";

type TransitionAction = {
  status: BookingStatus;
  label: string;
  variant: "primary" | "danger";
};

const ACTION_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "Confirm Booking",
  IN_PROGRESS: "Mark In Progress",
  COMPLETED: "Mark Completed",
  CANCELLED: "Cancel Booking",
  REFUNDED: "Process Refund",
  PENDING: "Set Pending",
};

function buildActions(allowed: BookingStatus[]): TransitionAction[] {
  return allowed.map((status) => ({
    status,
    label: ACTION_LABELS[status] ?? status,
    variant: DESTRUCTIVE_STATUSES.includes(status) ? "danger" : "primary",
  }));
}

export function AdminBookingActions({
  bookingId,
  currentStatus,
  allowedTransitions,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
  allowedTransitions: BookingStatus[];
}) {
  const router = useRouter();
  const [adminNotes, setAdminNotes] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [proofCaption, setProofCaption] = useState("");
  const [pendingAction, setPendingAction] = useState<TransitionAction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const actions = buildActions(allowedTransitions);

  const executeStatusUpdate = async (status: BookingStatus) => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes || undefined,
          completionNotes: status === "COMPLETED" ? completionNotes || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to update status");
        return;
      }
      setSuccess(`Status updated to ${BOOKING_STATUS_LABELS[status]}`);
      setPendingAction(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProofUpload = async () => {
    setIsUploadingProof(true);
    setError(null);
    try {
      let url = proofUrl.trim();

      if (proofFile) {
        const form = new FormData();
        form.append("file", proofFile);
        form.append("bucket", "proofs");
        form.append("folder", bookingId);
        const uploadRes = await fetch("/api/storage/upload", {
          method: "POST",
          body: form,
        });
        const uploadData = (await uploadRes.json()) as {
          success?: boolean;
          data?: { url?: string };
          error?: string;
        };
        if (!uploadRes.ok || !uploadData.success || !uploadData.data?.url) {
          setError(uploadData.error ?? "Failed to upload file to storage");
          return;
        }
        url = uploadData.data.url;
      }

      if (!url) {
        setError("Choose a file or paste a public media URL");
        return;
      }

      const res = await fetch(`/api/admin/bookings/${bookingId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          type: proofType,
          caption: proofCaption || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to save proof");
        return;
      }
      setSuccess("Proof added successfully");
      setProofUrl("");
      setProofFile(null);
      setProofCaption("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && <div className="adm-alert adm-alert-error" role="alert">{error}</div>}
      {success && <div className="adm-alert adm-alert-success" role="status">{success}</div>}

      {/* Status transitions */}
      {actions.length > 0 && (
        <div className="adm-detail-card" style={{ marginBottom: 0 }}>
          <div className="adm-detail-card-header">Update Status</div>
          <div className="adm-detail-card-body">
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: "0.875rem" }}>
              Current: <strong>{BOOKING_STATUS_LABELS[currentStatus]}</strong>
            </p>
            <label className="adm-label" htmlFor="admin-notes">Admin notes (optional)</label>
            <textarea
              id="admin-notes"
              className="adm-textarea"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal note for this status change…"
              rows={2}
              style={{ marginBottom: "0.75rem" }}
            />
            {allowedTransitions.includes("COMPLETED") && (
              <>
                <label className="adm-label" htmlFor="completion-notes">Completion notes</label>
                <textarea
                  id="completion-notes"
                  className="adm-textarea"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Notes for the devotee upon completion…"
                  rows={2}
                  style={{ marginBottom: "0.75rem" }}
                />
              </>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {actions.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  className={action.variant === "danger" ? "adm-action-btn danger" : "adm-topbar-btn"}
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setPendingAction(action)}
                  disabled={isUpdating}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {pendingAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100,
            display: "grid", placeItems: "center", padding: "1rem",
          }}
          onClick={() => !isUpdating && setPendingAction(null)}
        >
          <div
            className="adm-detail-card"
            style={{ maxWidth: 420, width: "100%", marginBottom: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-detail-card-header" id="confirm-title">Confirm Action</div>
            <div className="adm-detail-card-body">
              <p style={{ fontSize: "0.9375rem", color: "var(--fg)", marginBottom: "1rem", lineHeight: 1.6 }}>
                {pendingAction.variant === "danger"
                  ? `Are you sure you want to ${pendingAction.label.toLowerCase()}? This action follows backend transition rules and may notify the customer.`
                  : `Proceed with "${pendingAction.label}"?`}
              </p>
              <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
                <button type="button" className="adm-filter-btn" onClick={() => setPendingAction(null)} disabled={isUpdating}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={pendingAction.variant === "danger" ? "adm-action-btn danger" : "adm-topbar-btn"}
                  onClick={() => executeStatusUpdate(pendingAction.status)}
                  disabled={isUpdating}
                  aria-busy={isUpdating}
                >
                  {isUpdating ? "Updating…" : pendingAction.label}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof upload */}
      <div className="adm-detail-card" style={{ marginBottom: 0 }}>
        <div className="adm-detail-card-header">Add Proof Media</div>
        <div className="adm-detail-card-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <label className="adm-label" htmlFor="proof-type">Media type</label>
            <select
              id="proof-type"
              className="adm-select"
              value={proofType}
              onChange={(e) => setProofType(e.target.value as "PHOTO" | "VIDEO")}
            >
              <option value="PHOTO">Photo</option>
              <option value="VIDEO">Video</option>
            </select>
            <label className="adm-label" htmlFor="proof-file">Upload file (Supabase Storage)</label>
            <input
              id="proof-file"
              type="file"
              className="adm-input"
              accept="image/*,video/mp4,video/webm,application/pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            />
            <label className="adm-label" htmlFor="proof-url">Or paste public URL</label>
            <input
              id="proof-url"
              type="url"
              className="adm-input"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://…supabase.co/storage/v1/object/public/proofs/…"
            />
            <label className="adm-label" htmlFor="proof-caption">Caption (optional)</label>
            <input
              id="proof-caption"
              type="text"
              className="adm-input"
              value={proofCaption}
              onChange={(e) => setProofCaption(e.target.value)}
              placeholder="Brief description"
            />
            <button
              type="button"
              className="adm-topbar-btn"
              style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
              onClick={handleProofUpload}
              disabled={isUploadingProof || (!proofUrl.trim() && !proofFile)}
              aria-busy={isUploadingProof}
            >
              {isUploadingProof ? "Uploading…" : "Add Proof"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
