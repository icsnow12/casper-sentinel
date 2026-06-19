import { landingSignals } from "@/lib/demo-data";

export function AnimatedVoteField() {
  return (
    <div className="scanline terminal-grid relative min-h-[440px] overflow-hidden rounded-lg border border-white/10 bg-black/30 p-5 shadow-2xl shadow-emerald-950/20">
      <div className="absolute right-5 top-5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
        Live DAO vote simulation
      </div>

      <div className="absolute left-6 top-8 grid gap-2">
        {landingSignals.map((signal) => (
          <div
            key={signal.label}
            className="grid w-64 grid-cols-[88px_1fr_40px] items-center gap-3 text-xs"
          >
            <span className="text-muted-foreground">{signal.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-white/10">
              <span
                className={`${signal.color} block h-full rounded-full`}
                style={{
                  width: `${signal.value}%`,
                  opacity: 0.85,
                }}
              />
            </span>
            <span className="text-right text-foreground">{signal.value}</span>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-8 bottom-8 flex h-44 items-end justify-between gap-2">
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            className="signal-bar w-full rounded-t-sm bg-emerald-300/70"
            style={{
              height: `${30 + ((index * 17) % 68)}%`,
              animationDelay: `${index * 80}ms`,
            }}
          />
        ))}
      </div>

      <div className="float-slow absolute left-1/2 top-1/2 grid size-48 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-emerald-300/20 bg-emerald-300/[0.04]">
        <div className="grid size-32 place-items-center rounded-full border border-amber-200/20 bg-amber-200/[0.04]">
          <div className="grid size-20 place-items-center rounded-full border border-sky-300/20 bg-sky-300/[0.04] text-center">
            <span className="text-2xl font-semibold text-emerald-100">82</span>
            <span className="-mt-2 text-[10px] uppercase text-muted-foreground">
              quorum
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2 text-xs">
        {["Agent votes", "Trust weights", "Casper hash"].map((label, index) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-background/70 p-3"
          >
            <p className="text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-emerald-100">
              {index === 0 ? "07 / 08" : index === 1 ? "1.18x" : "0x8f4...21c"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
