import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/apiClient";
import { formatDateWIB } from "@/utils/formatters";
import { P50 } from "@/constants/testIds";

const MIN_REASON = 10;
const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Kartu BAST yang sudah terbit + tombol PDF & pembatalan (Fase 50A).
 *
 * Pembatalan disediakan karena BAST bisa salah terbit (unit tertukar). Yang TIDAK
 * disediakan adalah penghapusan: dokumen tetap ada dengan status “Dibatalkan” beserta
 * alasan & siapa yang membatalkannya, karena serah terima adalah peristiwa — bukan baris
 * yang boleh dihapus dari sejarah.
 */
export default function HandoverDocCard({ doc, onChanged }) {
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setReason(""); }, [open]);

  if (!doc) return null;
  const cancelled = doc.state === "cancelled";
  const reasonOk = reason.trim().length >= MIN_REASON;

  const cancel = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/handover/${doc.id}/cancel`, { reason: reason.trim() });
      toast.success(res.data?.message || "Serah terima dibatalkan.");
      setOpen(false);
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal membatalkan serah terima.");
    } finally { setBusy(false); }
  };

  return (
    <div data-testid={P50.handoverDoc} data-state={doc.state}
      className={`rounded-xl border p-4 ${cancelled
        ? "border-slate-200 bg-slate-50" : "border-emerald-200 bg-emerald-50/60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-base font-semibold">
            {doc.number} · {doc.state_label}
          </p>
          <p className="text-[13px] text-muted-foreground">
            Diserahkan {formatDateWIB(doc.handed_over_at)} kepada{" "}
            {doc.received_by || doc.buyer_name || "pembeli"} · diterbitkan {doc.issued_by}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Meter air {doc.meter_air || "—"} · meter listrik {doc.meter_listrik || "—"} · kunci{" "}
            {doc.keys_handed ?? "—"}
          </p>
          {doc.override_by ? (
            <p className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[12px] text-amber-900">
              Diserahkan dengan terobosan oleh {doc.override_by}: {doc.override_reason}
            </p>
          ) : null}
          {cancelled ? (
            <p className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[12px] text-rose-900">
              Dibatalkan {formatDateWIB(doc.cancelled_at)} oleh {doc.cancelled_by}:{" "}
              {doc.cancel_reason}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`${API}/api/handover/${doc.id}/pdf`} target="_blank" rel="noreferrer"
            data-testid={P50.handoverPdfBtn}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-[13px] font-medium hover:bg-secondary">
            <FileText className="h-3.5 w-3.5" /> Buka PDF
          </a>
          {!cancelled && can("handover", "cancel") ? (
            <Button size="sm" variant="outline" data-testid={P50.handoverCancelBtn}
              onClick={() => setOpen(true)}>
              <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Batalkan BAST
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid={P50.handoverCancelDialog}>
          <DialogHeader>
            <DialogTitle>Batalkan {doc.number}</DialogTitle>
            <DialogDescription>
              Status rumah dikembalikan dan masa garansi dari dokumen ini tidak berlaku lagi.
              Dokumennya tetap tersimpan dengan status “Dibatalkan”.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="ho-cancel-reason">Alasan (minimal {MIN_REASON} huruf)</Label>
            <Textarea id="ho-cancel-reason" rows={3} data-testid={P50.handoverCancelReason}
              value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="mis. unit tertukar, seharusnya rumah nomor sebelah" />
            <p className={`text-[11px] ${reasonOk ? "text-muted-foreground" : "text-rose-700"}`}>
              {reason.trim().length}/{MIN_REASON} huruf
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} data-testid={P50.handoverCancelClose}
              onClick={() => setOpen(false)}>Batal</Button>
            <Button variant="destructive" data-testid={P50.handoverCancelSubmit}
              disabled={busy || !reasonOk} onClick={cancel}>
              {busy ? "Memproses…" : "Batalkan serah terima"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
