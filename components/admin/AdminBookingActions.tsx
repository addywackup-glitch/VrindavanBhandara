"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle, X } from "lucide-react";

const NEXT_STATUS: Record<string, { label: string; status: string; color: string }> = {
  PENDING: { label: "Confirm Booking", status: "CONFIRMED", color: "#3B82F6" },
  CONFIRMED: { label: "Mark In Progress", status: "IN_PROGRESS", color: "#FF7722" },
  IN_PROGRESS: { label: "Mark Completed", status: "COMPLETED", color: "#10B981" },
};

export function AdminBookingActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Proof upload state
  const [proofUrl, setProofUrl] = useState("");
  const [proofType, setProofType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [proofCaption, setProofCaption] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const nextAction = NEXT_STATUS[currentStatus];

  const handleStatusUpdate = async () => {
    if (!nextAction) return;
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextAction.status, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update status");
        return;
      }
      setSuccess(`Status updated to ${nextAction.status}`);
      setNote("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProofUpload = async () => {
    if (!proofUrl.trim()) {
      setError("Please enter a valid proof URL");
      return;
    }
    setIsUploadingProof(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: proofUrl, type: proofType, caption: proofCaption || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to upload proof");
        return;
      }
      setSuccess("Proof added successfully");
      setProofUrl("");
      setProofCaption("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Status Transition */}
      {nextAction && (
        <div
          className="rounded-xl p-4"
          style={{ border: "1px solid rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.04)" }}
        >
          <p className="text-xs font-bold text-gray-600 mb-3">Update Status</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for this status update..."
            rows={2}
            className="w-full p-2.5 rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700 mb-3 resize-none"
          />
          <button
            onClick={handleStatusUpdate}
            disabled={isUpdating}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${nextAction.color}, ${nextAction.color}CC)` }}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {nextAction.label}
          </button>
        </div>
      )}

      {/* Proof Upload */}
      <div
        className="rounded-xl p-4"
        style={{ border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.03)" }}
      >
        <p className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-2">
          <Upload className="w-3.5 h-3.5" /> Add Proof Media
        </p>
        <div className="space-y-2">
          <select
            value={proofType}
            onChange={(e) => setProofType(e.target.value as "IMAGE" | "VIDEO")}
            className="w-full p-2.5 rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 bg-white"
          >
            <option value="IMAGE">Photo</option>
            <option value="VIDEO">Video</option>
          </select>
          <input
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="CDN URL (e.g. https://cdn.example.com/proof.jpg)"
            className="w-full p-2.5 rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
          />
          <input
            type="text"
            value={proofCaption}
            onChange={(e) => setProofCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full p-2.5 rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
          />
          <button
            onClick={handleProofUpload}
            disabled={isUploadingProof || !proofUrl.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Add Proof
          </button>
        </div>
      </div>
    </div>
  );
}
