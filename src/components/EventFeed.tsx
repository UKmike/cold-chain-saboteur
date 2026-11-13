import { ActiveDisruption, LogEvent } from '../engine/types';

interface EventFeedProps {
  logs: LogEvent[];
  activeDisruptions: ActiveDisruption[];
}

export function EventFeed({ logs, activeDisruptions }: EventFeedProps) {
  return (
    <aside className="flex h-full flex-col gap-3 rounded-xl border border-slate-800/90 bg-[#0b1526]/90 p-3">
      {/* Active Sabotages */}
      <div>
        <h3 className="mb-2 text-[11px] font-bold tracking-wider text-slate-300 uppercase">
          Active Disruptions ({activeDisruptions.length})
        </h3>
        {activeDisruptions.length === 0 ? (
          <p className="rounded-lg bg-slate-900/60 px-2.5 py-2 text-[11px] text-slate-500">
            No active sabotages. Play a Disruption Card below!
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {activeDisruptions.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs ring-1 ring-rose-500/30"
              >
                <div>
                  <span className="font-semibold text-rose-200">{d.name}</span>
                  <span className="ml-1.5 text-[10px] text-rose-300/80 uppercase">
                    ({d.targetId})
                  </span>
                </div>
                <span className="font-mono-num text-[11px] font-bold text-rose-300">
                  {d.remainingDays.toFixed(1)}d
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Operations Log */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-slate-800 pt-2.5">
        <h3 className="mb-2 text-[11px] font-bold tracking-wider text-slate-300 uppercase">
          Logistics Feed
        </h3>
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {logs.map((log) => {
            const badgeColor =
              log.kind === 'strike'
                ? 'border-rose-500/50 bg-rose-950/40 text-rose-200'
                : log.kind === 'player'
                  ? 'border-violet-500/40 bg-violet-950/30 text-violet-200'
                  : log.kind === 'alert'
                    ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300';

            return (
              <div key={log.id} className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${badgeColor}`}>
                <span className="font-mono-num mr-1.5 font-bold opacity-75">D{log.day}</span>
                <span>{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
