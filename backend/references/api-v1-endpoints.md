# API v1 Endpoint Guide

Base URL:
- `http://localhost/api/v1`

Health check:
- `GET http://localhost/api/health`

## Skill alignment used

Implementation follows these project skills and guards:
- `thesis-system-guard`
- `contract-module-planner`
- `payment-module-planner`
- `project-progress-module-planner`
- `reporting-module-planner`
- `engineering-stack-guard`
- `laravel-api`

Additional package decisions aligned to project scope:
- auth token API: Laravel Sanctum
- role and permission: Spatie Laravel Permission
- media upload: Spatie Media Library
- activity log: Spatie Activitylog
- PDF export: Laravel DomPDF
- Excel and CSV export: Laravel Excel

## Starter credentials

All seeded users use password:
- `password`

Available seeded users:
- `admin@centralsaga.test`
- `finance@centralsaga.test`
- `pm@centralsaga.test`
- `client@centralsaga.test`

## Response pattern

JSON endpoints:
- collection: `data`, `links`, `meta`
- detail: `data`
- create: `201 Created`
- delete: `204 No Content`
- validation error: `422`
- unauthorized: `401`
- forbidden: `403`

Export endpoints return file download responses.

---

## 1. Public Endpoint

### GET `/health`
Purpose:
- cek backend aktif

Example response:
```json
{
  "status": "ok",
  "service": "backend"
}
```

---

## 2. Authentication

### POST `/auth/login`
Purpose:
- login dan ambil token Sanctum

Body:
```json
{
  "email": "admin@centralsaga.test",
  "password": "password",
  "device_name": "postman"
}
```

Example response:
```json
{
  "data": {
    "token": "1|plain-text-token",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "Central Saga Admin",
      "email": "admin@centralsaga.test",
      "roles": ["admin"],
      "permissions": [
        "manage clients",
        "manage contracts",
        "manage payment terms",
        "manage payments"
      ]
    }
  }
}
```

### GET `/auth/me`
Headers:
- `Authorization: Bearer <token>`

Example response:
```json
{
  "data": {
    "id": 1,
    "name": "Central Saga Admin",
    "email": "admin@centralsaga.test",
    "roles": ["admin"],
    "permissions": ["manage clients", "manage contracts"]
  }
}
```

### POST `/auth/logout`
Headers:
- `Authorization: Bearer <token>`

Example response:
```json
{
  "message": "Logged out successfully."
}
```

---

## 3. Dashboard Summary

### GET `/dashboard/summary`
Permission:
- `view reporting dashboard`

Example response:
```json
{
  "data": {
    "clients": { "total": 3, "active": 2 },
    "contracts": { "total": 3, "active": 2, "completed": 1, "total_value": "950000000.00" },
    "payment_terms": { "total": 8, "pending_review": 2, "paid": 5, "overdue": 1 },
    "payments": { "total": 6, "verified": 5, "pending_review": 1, "rejected": 0 },
    "project_progress": { "total_updates": 4, "in_progress": 2, "delayed": 1, "completed": 1 }
  }
}
```

---

## 4. Activity Logs

### GET `/activity-logs`
Permission:
- `view activity logs`

Query params:
- `log_name`
- `event`
- `per_page`

Example response shape:
```json
{
  "data": [
    {
      "id": 1,
      "log_name": "contract",
      "description": "updated",
      "subject_type": "App\\Models\\Contract",
      "subject_id": 1,
      "causer_type": null,
      "causer_id": null,
      "event": "updated",
      "properties": [],
      "created_at": "2026-03-27T17:00:00+00:00"
    }
  ],
  "links": {},
  "meta": {}
}
```

---

## 5. Clients

### GET `/clients`
Permission:
- `manage clients`

Query params:
- `search`
- `status`
- `per_page`

### POST `/clients`
Body:
```json
{
  "client_code": "CL-010",
  "company_name": "PT Demo Postman",
  "contact_person": "Sari Utama",
  "email": "sari@demo-postman.test",
  "phone": "0812-9999-0010",
  "address": "Bandung, Jawa Barat",
  "status": "active",
  "portal_access_enabled": true
}
```

### GET `/clients/{id}`
### PUT `/clients/{id}`
### PATCH `/clients/{id}`
Update body example:
```json
{
  "company_name": "PT Demo Postman Updated",
  "status": "inactive"
}
```

### DELETE `/clients/{id}`
Notes:
- gagal `409` jika client masih punya kontrak

Client response shape:
```json
{
  "data": {
    "id": 1,
    "client_code": "CL-001",
    "company_name": "PT Nusantara Arsitek",
    "contact_person": "Rina Kurnia",
    "email": "rina@nusantara-arsitek.test",
    "phone": "0812-1000-0001",
    "address": "Denpasar, Bali",
    "status": "active",
    "portal_access_enabled": true,
    "contracts_count": 1,
    "active_contracts_count": 1,
    "contracts": []
  }
}
```

---

## 6. Contracts

### GET `/contracts`
Permission:
- `manage contracts`

Query params:
- `search`
- `client_id`
- `status`
- `per_page`

### POST `/contracts`
Body:
```json
{
  "client_id": 1,
  "contract_number": "KCS-2026-010",
  "contract_title": "Kontrak Uji Postman",
  "project_name": "Project Uji API",
  "contract_date": "2026-03-28",
  "start_date": "2026-04-01",
  "end_date": "2026-06-30",
  "contract_value": 125000000,
  "project_scope": "Starter contract untuk pengujian API.",
  "payment_scheme_summary": "50%-50%",
  "contract_status": "draft",
  "notes": "Dibuat dari Postman",
  "created_by": 1,
  "updated_by": 1
}
```

### GET `/contracts/{id}`
### PUT `/contracts/{id}`
### PATCH `/contracts/{id}`
Update body example:
```json
{
  "contract_status": "active",
  "notes": "Status diperbarui dari Postman",
  "updated_by": 1
}
```

### DELETE `/contracts/{id}`
Notes:
- gagal `409` jika masih punya payment term atau progress

Contract response shape:
```json
{
  "data": {
    "id": 1,
    "client": {
      "id": 1,
      "client_code": "CL-001",
      "company_name": "PT Nusantara Arsitek"
    },
    "contract_number": "KCS-2026-001",
    "contract_title": "Implementasi portal kontrak fase 1",
    "project_name": "Portal Kontrak Fase 1",
    "contract_date": "2026-01-10",
    "start_date": "2026-01-15",
    "end_date": "2026-05-30",
    "contract_value": "450000000.00",
    "project_scope": "Pengembangan modul kontrak, termin pembayaran, dan dashboard awal.",
    "payment_scheme_summary": "40%-30%-30%",
    "contract_status": "active",
    "payment_terms_count": 3,
    "project_progress_updates_count": 2,
    "payment_terms": [],
    "project_progress": [],
    "latest_progress": {
      "id": 2,
      "percentage": 78,
      "status": "in_progress"
    }
  }
}
```

---

## 7. Payment Terms

### GET `/payment-terms`
Permission:
- `manage payment terms`

Query params:
- `contract_id`
- `status`
- `overdue_only`
- `per_page`

### POST `/payment-terms`
Body:
```json
{
  "contract_id": 1,
  "term_number": 4,
  "term_title": "Termin tambahan",
  "due_date": "2026-06-15",
  "amount": 50000000,
  "description": "Termin tambahan hasil perubahan lingkup kerja.",
  "status": "pending",
  "payable_after_condition": "Setelah UAT",
  "created_by": 2,
  "updated_by": 2
}
```

### GET `/payment-terms/{id}`
### PUT `/payment-terms/{id}`
### PATCH `/payment-terms/{id}`
### DELETE `/payment-terms/{id}`

Payment term response shape:
```json
{
  "data": {
    "id": 1,
    "contract": {
      "id": 1,
      "contract_number": "KCS-2026-001",
      "contract_title": "Implementasi portal kontrak fase 1",
      "client_id": 1
    },
    "term_number": 1,
    "term_title": "Termin awal",
    "due_date": "2026-01-20",
    "amount": "180000000.00",
    "status": "paid",
    "payments": []
  }
}
```

---

## 8. Payments

### GET `/payments`
Permission:
- `manage payments`

Query params:
- `payment_term_id`
- `status`
- `per_page`

### POST `/payments`
Body:
```json
{
  "payment_term_id": 5,
  "payment_date": "2026-04-20",
  "amount": 160000000,
  "method": "transfer",
  "status": "pending_review"
}
```

### GET `/payments/{id}`
### PUT `/payments/{id}`
### PATCH `/payments/{id}`
Update body example:
```json
{
  "status": "verified",
  "method": "transfer",
  "amount": 160000000
}
```

### DELETE `/payments/{id}`

Payment response shape:
```json
{
  "data": {
    "id": 5,
    "payment_term_id": 5,
    "payment_term": {
      "id": 5,
      "contract_id": 2,
      "term_number": 2,
      "term_title": "Termin final",
      "status": "overdue"
    },
    "payment_date": "2026-04-18",
    "amount": "160000000.00",
    "method": "transfer",
    "status": "pending_review",
    "proof_files": []
  }
}
```

### POST `/payments/{payment}/proof`
Permission:
- role `client` or permission `manage payments` or `upload payment proofs`

Body (multipart form-data):
- `file` => pdf/jpg/jpeg/png/webp
- `notes` => optional text

Example response:
```json
{
  "message": "Payment proof uploaded successfully.",
  "data": {
    "payment": {
      "id": 5,
      "status": "pending_review"
    },
    "proof": {
      "id": 1,
      "name": "proof",
      "file_name": "proof.png",
      "mime_type": "image/png",
      "size": 12345,
      "url": "http://localhost/storage/.../proof.png",
      "notes": "Bukti transfer dari client"
    }
  }
}
```

---

## 9. Project Progress

### GET `/project-progress`
Permission:
- `manage project progress`

Query params:
- `contract_id`
- `status`
- `per_page`

### POST `/project-progress`
Body:
```json
{
  "contract_id": 1,
  "progress_date": "2026-03-28",
  "progress_title": "Update progres sprint backend",
  "progress_description": "API v1 kontrak dan pembayaran sudah siap diuji via Postman.",
  "percentage": 85,
  "status": "in_progress",
  "milestone_reference": "Milestone backend API",
  "notes": "Disiapkan untuk validasi bersama tim",
  "updated_by": 3
}
```

### GET `/project-progress/{id}`
### PUT `/project-progress/{id}`
### PATCH `/project-progress/{id}`
### DELETE `/project-progress/{id}`

Project progress response shape:
```json
{
  "data": {
    "id": 2,
    "contract": {
      "id": 1,
      "contract_number": "KCS-2026-001",
      "contract_title": "Implementasi portal kontrak fase 1",
      "client_id": 1
    },
    "progress_date": "2026-03-10",
    "progress_title": "Dashboard awal",
    "progress_description": "Dashboard internal dan ringkasan progres mulai stabil.",
    "percentage": 78,
    "status": "in_progress",
    "milestone_reference": "Milestone berjalan",
    "notes": "Starter data untuk pengujian modul progres."
  }
}
```

---

## 10. Exports

### GET `/exports/contracts?format=pdf`
### GET `/exports/contracts?format=xlsx`
### GET `/exports/contracts?format=csv`

### GET `/exports/payments?format=pdf`
### GET `/exports/payments?format=xlsx`
### GET `/exports/payments?format=csv`

### GET `/exports/project-progress?format=pdf`
### GET `/exports/project-progress?format=xlsx`
### GET `/exports/project-progress?format=csv`

Permission:
- `export reports`

Notes:
- `format` supported: `pdf`, `xlsx`, `csv`
- response berupa file download, bukan JSON

Example:
- `GET /api/v1/exports/contracts?format=pdf`
- `GET /api/v1/exports/payments?format=csv`
- `GET /api/v1/exports/project-progress?format=xlsx`

---

## Current seeded baseline

After `migrate:fresh --seed`, starter data contains:
- 3 clients
- 3 contracts
- 8 payment terms
- 6 payments
- 4 project progress updates
- seeded payment proof media
- roles: `admin`, `finance`, `project-manager`, `client`
- permissions for contracts, payments, progress, dashboard, activity logs, exports, and portal access

## Notes on thesis alignment

This backend follows the thesis table outline with a few controlled adjustments:
- `clients` uses `client_code` and `company_name` for stronger business identity
- `contracts` includes `project_name`, `project_scope`, and `payment_scheme_summary`
- `payment_terms` includes `term_title` and condition note
- `payments` is kept separate from `payment_terms`
- payment proof files are stored through Spatie Media Library in table `media`
- user role and permission access is handled through Spatie Permission tables plus pivot tables
- activity history is stored in `activity_log` through Spatie Activitylog

These additions stay inside project scope and support practical API implementation.
