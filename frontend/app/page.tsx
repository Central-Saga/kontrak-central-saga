const keyMetrics = [
  {
    label: "Kontrak aktif",
    value: "24",
    note: "Masih berjalan dan jadi acuan termin serta progres.",
  },
  {
    label: "Termin jatuh tempo",
    value: "6",
    note: "Perlu tindak lanjut finance pada 7 hari ke depan.",
  },
  {
    label: "Validasi bukti bayar",
    value: "4",
    note: "Masuk antrean review finance hari ini.",
  },
  {
    label: "Proyek terlambat",
    value: "2",
    note: "Perlu perhatian PM dan manajemen.",
  },
];

const modules = [
  {
    title: "Kontrak",
    caption: "Root entity",
    description:
      "Kelola identitas kontrak, nilai proyek, periode, dan kaitannya ke termin pembayaran.",
  },
  {
    title: "Pembayaran",
    caption: "Finance flow",
    description:
      "Pantau termin, bukti bayar, validasi finance, dan overdue tanpa melebar ke akuntansi penuh.",
  },
  {
    title: "Progres proyek",
    caption: "PM visibility",
    description:
      "Lihat status kerja, milestone, dan keterkaitannya dengan tahap pembayaran serta laporan.",
  },
  {
    title: "Pelaporan",
    caption: "Management recap",
    description:
      "Sajikan ringkasan kontrak, pembayaran, overdue, dan progres dalam dashboard operasional.",
  },
];

const paymentQueue = [
  {
    contract: "KCS-2026-014",
    client: "PT Nusantara Arsitek",
    state: "Review bukti bayar",
    amount: "Rp145 jt",
  },
  {
    contract: "KCS-2026-009",
    client: "PT Lintas Data Prima",
    state: "Jatuh tempo 2 hari",
    amount: "Rp92 jt",
  },
  {
    contract: "KCS-2026-003",
    client: "CV Pilar Mandiri",
    state: "Terverifikasi",
    amount: "Rp48 jt",
  },
];

const progressSnapshot = [
  {
    project: "Portal Kontrak Fase 1",
    progress: "78%",
    status: "On track",
  },
  {
    project: "Integrasi Validasi Pembayaran",
    progress: "52%",
    status: "Butuh review finance",
  },
  {
    project: "Dashboard Manajemen",
    progress: "31%",
    status: "Menunggu data kontrak final",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 sm:px-8 lg:px-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-card p-6 shadow-[0_30px_80px_rgba(24,33,39,0.08)] backdrop-blur md:p-10">
        <div className="absolute inset-y-0 right-0 hidden w-80 bg-[radial-gradient(circle_at_center,_rgba(15,118,110,0.18),_transparent_70%)] lg:block" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent-soft px-4 py-1 text-xs font-semibold tracking-[0.24em] text-accent uppercase">
              PT Central Saga Mandala
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Dashboard awal untuk sistem kontrak, pembayaran, progres, dan pelaporan.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                Fondasi ini menempatkan frontend sebagai pintu masuk utama, backend Laravel sebagai API,
                PostgreSQL sebagai basis data inti, dan alur bisnis tetap terjaga sesuai scope project.
              </p>
            </div>
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-line bg-card-strong p-4 text-sm text-muted sm:grid-cols-3 lg:min-w-[26rem]">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-highlight">
                Routing
              </div>
              <div className="mt-2 font-semibold text-foreground">`/` frontend</div>
              <div className="text-foreground">`/api` backend</div>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-highlight">
                Stack
              </div>
              <div className="mt-2 font-semibold text-foreground">Next.js + Laravel</div>
              <div className="text-foreground">PostgreSQL + Docker</div>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-highlight">
                Delivery
              </div>
              <div className="mt-2 font-semibold text-foreground">GHCR ready</div>
              <div className="text-foreground">Dokploy aware</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {keyMetrics.map((item) => (
          <article
            key={item.label}
            className="rounded-[1.75rem] border border-line bg-card p-5 shadow-[0_16px_40px_rgba(24,33,39,0.05)] backdrop-blur"
          >
            <p className="text-sm font-medium text-muted">{item.label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-line bg-card p-6 backdrop-blur md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-highlight">
                Area utama
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Modul inti sistem</h2>
            </div>
            <span className="rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              Scope guarded
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {modules.map((module) => (
              <article
                key={module.title}
                className="rounded-[1.5rem] border border-line bg-card-strong p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                    {module.caption}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">{module.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-[#162228] p-6 text-white shadow-[0_16px_44px_rgba(15,26,31,0.18)] md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9fd7cf]">Operasional hari ini</p>
          <h2 className="mt-2 text-2xl font-semibold">Fokus finance dan project manager</h2>
          <div className="mt-6 space-y-4">
            {paymentQueue.map((item) => (
              <div key={item.contract} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{item.contract}</p>
                    <p className="mt-1 text-sm text-white/70">{item.client}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#9fd7cf]">
                    {item.amount}
                  </span>
                </div>
                <p className="mt-3 text-sm text-white/80">{item.state}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-line bg-card p-6 backdrop-blur md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-highlight">
            Progress snapshot
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Ringkasan progres proyek</h2>
          <div className="mt-6 space-y-4">
            {progressSnapshot.map((item) => (
              <div
                key={item.project}
                className="rounded-[1.4rem] border border-line bg-card-strong px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.project}</p>
                    <p className="mt-1 text-sm text-muted">{item.status}</p>
                  </div>
                  <span className="text-xl font-semibold text-accent">{item.progress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-card p-6 backdrop-blur md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-highlight">
            Delivery baseline
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Fondasi engineering sudah siap dikembangkan</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-line bg-card-strong p-5">
              <p className="text-sm font-semibold text-foreground">Container terpisah</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Frontend, backend, database, dan proxy dipisahkan agar deploy tetap modular.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-line bg-card-strong p-5">
              <p className="text-sm font-semibold text-foreground">Routing domain-first</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Proxy memetakan root app ke Next.js dan `/api` ke Laravel untuk pengalaman satu domain.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-line bg-card-strong p-5">
              <p className="text-sm font-semibold text-foreground">CI siap diperluas</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Workflow dasar akan memvalidasi lint, test, build, lalu image backend dan frontend.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-line bg-card-strong p-5">
              <p className="text-sm font-semibold text-foreground">Scope tetap terjaga</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Sistem difokuskan ke kontrak, pembayaran, progres, laporan, dan portal klien.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
