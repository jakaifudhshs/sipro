# Rencana Development SIPRO — Penutupan Fase 49 + Lanjut Fase 50 (Serah Terima & Garansi, lalu PWA Offline Terpadu)

Problem statement (verbatim):
> "saya ingin anda lanjutkan development dari repo ini https://github.com/saweriasahava/sipro
> sebelevumnya developmnet terhenti di
> UI verified visually. Now running comprehensive E2E multi-role testing: (testing_agent_v3 was invoked for Fase 49 UI/E2E with 15 user stories ... )"

## 1) Objectives
1. **Menutup Fase 49** secara benar: mutasi lengkap tertangkap, E2E multi-peran tuntas, dokumen & test_result rapi.
2. **Fase 50A (Serah Terima & Garansi)**: alur BAST serah-terima bernomor + PDF + status unit `handed_over`, memulai periode garansi, dan klaim garansi pasca-huni yang terhubung punch list + CS complaints.
3. **Fase 50B (PWA Offline Terpadu)**: satu antrean offline untuk absensi (F47) + field diary + punch list + foto, dengan **idempotensi client_ref** di backend dan panel antrean terpadu di UI.
4. **Guardrails**: tambah 2 gate baru (target **40 gates**) + `mutasi_50.py` yang membuktikan gigi.

---

## 2) Implementation Steps

### Phase 0 — Tutup sisa Fase 49 (wajib)
**0.1 Mutasi F49 selesai & hijau**
- Pastikan `python3 scripts/mutasi_49.py` selesai dan **SEMUA mutasi TERTANGKAP** (M01..M24).
- Pastikan tidak ada “leftover mutation” (baseline git commit sudah ada).

**0.2 E2E multi-role (testing_agent_v3)**
- Fokus ulang: **US11 / US13 / US14**, plus regresi US1–US12/US15.
- Skenario ganti peran gunakan tombol **Keluar** di TopBar (`logout-button`).

**0.3 Dokumentasi F49**
- Update: `test_result.md` (status US + gate + mutasi), `CODEBASE_MAP.md` (delta UX RBAC tax + testIds cancel), `memory/test_credentials.md` (bila ada perubahan), `plan.md` (tandai F49 closed).

**User stories (F49 penutupan):**
1. Sebagai finance, saya bisa membayar AP dengan opsi “Potong PPh” dan melihat pratinjau NETO yang jujur.
2. Sebagai sales, saya melihat kartu “Akses ditolak” yang manusiawi di /tax (tanpa bocor nama izin).
3. Sebagai finlead, saya tidak bisa override penutupan tanpa alasan ≥10 karakter.
4. Sebagai owner, saya melihat laporan owner-pack yang tidak memalsukan angka 0 saat data belum ada.
5. Sebagai QA, semua tombol “Batal” dialog F49 bisa ditekan stabil (punya data-testid spesifik).

---

### Phase 1 — POC Core Fase 50A (Serah Terima & Garansi) — **jangan lanjut sebelum PASS**
**Output:** `poc/poc_50.py` PASS + cleanup bersih.

**Core flow yang dibuktikan:**
1. **Precondition hold**: BAST serah-terima **ditahan** bila ada blocker (mis. punch open, dokumen wajib hilang, kewajiban finansial belum beres) dan alasan menyebut blocker nyata.
2. **Override**: waiver butuh izin + alasan ≥10, menyimpan audit trail + melahirkan *review task*.
3. **Idempotensi**: penerbitan BAST untuk deal/unit yang sama idempoten (source_event / client_ref) dan **nomor dokumen stabil**.
4. **Dokumen PDF**: BAST menghasilkan dokumen PDF nyata (registry) dan bisa diunduh.
5. **Warranty**: status unit jadi `handed_over` + periode garansi per kategori (dari settings/SSOT) dihitung jujur.
6. **Warranty claim lifecycle**: buat klaim (dari complaint/portal), validasi masa garansi, menghasilkan work item (punch-style), selesai butuh bukti foto + verifikator != pengaju, close butuh ack pembeli.

**Websearch (best practice)**
- Cari praktik idempotensi & “offline replay safe” untuk FastAPI + MongoDB (client_ref pattern) dan numbering doc.

**User stories (POC 50A):**
1. Sebagai finance/owner, saya menerbitkan BAST hanya jika syarat terpenuhi atau saya override dengan alasan jelas.
2. Sebagai PM, saya menerima work item perbaikan dari klaim garansi dan harus unggah bukti sebelum selesai.
3. Sebagai CS, saya mengubah complaint menjadi klaim garansi dan statusnya bisa dilacak.
4. Sebagai pembeli (portal), klaim yang sudah lewat garansi ditolak dengan alasan yang jujur.
5. Sebagai auditor, saya bisa menelusuri siapa override dan kapan, serta task review yang lahir.

---

### Phase 2 — V1 App Dev Fase 50A (Backend + UI)
**Backend**
- Tambah modul: `models_p50.py`, `reference_p50.py`, `handover_engine.py`, `warranty_engine.py`.
- Router: `routers/handover_router.py` (wire di `server.py`).
- RBAC: izin minimal `handover:view/create/override`, `warranty:view/claim/manage`.
- Integrasi dokumen: pakai `doc_registry`/`documents_router` + `pdf_utils` (reportlab) untuk PDF BAST.
- Seed: `seed_phase50.py` idempoten, bertanda `demo_batch="fase50"`.
  - 1 unit “ready for handover”, 1 sudah `handed_over`, 1 claim aktif, 1 claim expired.

**Frontend**
- `constants/testIds/p50.js` (wajib untuk semua aksi klik/field input).
- UI tanpa pintu sidebar baru (sebisa mungkin):
  - `UnitDetailPage` tab **Serah Terima & Garansi** (status, tombol terbit BAST, daftar garansi, klaim).
  - Hook ke CS complaints (tautan “jadikan klaim garansi” bila eligible).
  - Portal buyer: ringkas garansi + buat klaim + lihat status.
- Semua label state/kind dari SSOT `/api/reference`.
- Semua laporan/rekap tidak menampilkan “0 palsu”; pakai “belum ada data” bila missing.

**E2E V1 (testing_agent_v3)**
- Role: owner, finlead, finance, pm, site, cs, portal buyer.

**User stories (V1 50A):**
1. Sebagai finance, saya menerbitkan BAST dari tab unit dan PDF bisa diunduh.
2. Sebagai owner, saya melihat daftar unit yang sudah serah terima beserta status garansi.
3. Sebagai CS, saya membuat klaim garansi dari complaint dan menugaskan ke tim proyek.
4. Sebagai site/PM, saya menutup pekerjaan klaim dengan bukti foto dan verifikasi.
5. Sebagai pembeli, saya melihat status klaim dan memberikan acknowledgement saat selesai.

---

### Phase 3 — POC Core Fase 50B (Offline terpadu: absensi + field + punch + foto)
**Output:** `poc/poc_50b.py` (atau perluasan `poc_50.py`) PASS.

**Core flow yang dibuktikan:**
1. **Satu antrean** (frontend) mendukung job kinds baru: `attendance_submit`, `field_diary_post`, `punch_create`, `punch_status`, plus foto.
2. **Backend idempotensi client_ref** untuk endpoint baru (replay tidak menggandakan data).
3. **Honest rejection**: bila server 4xx, antrean jadi `rejected` dengan alasan asli.
4. **Foto**: upload blob sekali, swap local id → file id, tidak mengunggah ganda.

**User stories (POC 50B):**
1. Sebagai mandor/site, saya mencatat absensi tanpa sinyal dan data terkirim saat online.
2. Sebagai site, saya membuat field diary + upload foto saat offline dan tidak hilang.
3. Sebagai site, saya membuat/menutup punch list offline tanpa dobel data.
4. Sebagai finance/PM, saya melihat antrean menampilkan job yang ditolak beserta alasannya.
5. Sebagai QA, saya mengirim ulang job yang sama 3x dan backend mengembalikan hasil lama (idempoten).

---

### Phase 4 — V1 App Dev Fase 50B (Backend + UI)
**Backend**
- Tambah `client_ref` ke:
  - `POST /labor/attendance`
  - `POST /field/diary`
  - `POST /field/punchlist`
  - `POST /field/punchlist/{id}/status`
- Pola: sama seperti build submit: simpan hasil per `(org_id, user_id, endpoint_kind, client_ref)`.

**Frontend**
- Extend `offlineSync.js` + SSOT `offline_queue_kind`:
  - Tambah mapping send() untuk job kinds baru.
- Panel antrean terpadu: bisa diakses dari Papan Mandor + Absensi + Field.

**E2E V1 (testing_agent_v3)**
- Fokus state offline/online yang bisa diuji otomatis (tanpa kamera).

---

### Phase 5 — Gates + Mutasi + Docs + Close
**Gates (target 40):**
- Gate 39: `scripts/verify_handover_warranty.py`
- Gate 40: `scripts/verify_offline_queue.py`
- Register di `scripts/run_all_gates.sh`.

**Mutasi:**
- `scripts/mutasi_50.py` (16–24 mutasi):
  - BAST tanpa precondition hold
  - override reason < 10 diterima
  - idempotensi BAST/claim/offline client_ref bocor
  - claim expired tetap diterima
  - closing claim tanpa bukti/verification separation
  - offline job 4xx tidak jadi rejected

**Docs:**
- `docs/v2/44_HANDOVER_WARRANTY_SPEC.md`
- `docs/v2/45_OFFLINE_PWA_SPEC.md`
- Update: `CODEBASE_MAP.md`, `test_result.md`, `memory/test_credentials.md`, `plan.md`.

**User stories (Gates/Close):**
1. Sebagai auditor, saya percaya karena gate & mutasi membuktikan guardrail.
2. Sebagai tim dev, `bash scripts/run_all_gates.sh` PASS (40 gates).
3. Sebagai QA, `python3 scripts/mutasi_50.py` semua TERTANGKAP.
4. Sebagai user, dokumentasi jelas memetakan endpoint ↔ UI.
5. Sebagai admin, seed demo bisa dijalankan berulang tanpa duplikasi.

---

## 3) Next Actions
1. Biarkan `mutasi_49.py` selesai → catat hasil akhir dan pastikan baseline tidak termutasi.
2. Jalankan E2E multi-role (testing_agent_v3) fokus US11/US13/US14 + regresi.
3. Update `test_result.md` + dokumen penutup F49; tandai F49 closed.
4. Mulai Phase 1: tulis `poc/poc_50.py` untuk serah-terima + garansi + klaim.
5. Implement backend+seed+UI minimal untuk lulus POC 50A.
6. Lanjut Phase 3/4: POC + implementasi antrean offline terpadu (client_ref idempotency).
7. Tambah gate 39/40 + mutasi_50 + docs + E2E; target 40 gates PASS.

---

## 4) Success Criteria
**Fase 49**
- `python3 scripts/mutasi_49.py` → semua mutasi **TERTANGKAP**.
- `bash scripts/run_all_gates.sh` → **OVERALL PASS (38 gates)**.
- E2E multi-peran: US1–US15 PASS (khusus US11/US13/US14 sudah tervalidasi ulang).

**Fase 50A**
- `python3 poc/poc_50.py` → PASS (preconditions hold + override + idempotent + PDF + warranty + claims).
- UI V1: tab Serah Terima & Garansi berfungsi untuk peran relevan; portal buyer bisa buat klaim.

**Fase 50B**
- POC offline: replay-safe (client_ref), foto tidak dobel, rejected state jujur.
- UI antrean terpadu tampil konsisten, label dari SSOT.

**Guardrails & Docs**
- `bash scripts/run_all_gates.sh` → **OVERALL PASS (40 gates)**.
- `python3 scripts/mutasi_50.py` → semua mutasi **TERTANGKAP**.
- Docs & peta kode ter-update; `test_result.md` mencerminkan status terbaru.
