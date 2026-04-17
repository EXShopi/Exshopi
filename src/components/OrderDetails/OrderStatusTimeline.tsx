import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Package2, RotateCcw, ShieldAlert, Truck } from 'lucide-react';
import { formatOrderDateTime } from '../../lib/orderAdmin';

interface TrackingEvent {
  id: string;
  status: string;
  timestamp: string;
  notes?: string;
  location?: string;
}

export interface OrderStatusTimelineProps {
  events: TrackingEvent[];
  currentStatus: string;
  orderId: string;
}

const STAGE_META = [
  { key: 'placed', label: 'Order Placed', icon: Clock3 },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: Package2 },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  { key: 'returned', label: 'Returned', icon: RotateCcw },
  { key: 'refunded', label: 'Refunded', icon: ShieldAlert },
] as const;

function normalizeStageKey(value: string) {
  const status = String(value || '').toLowerCase();

  if (status.includes('refund')) return 'refunded';
  if (status.includes('return')) return 'returned';
  if (status.includes('delivered')) return 'delivered';
  if (status.includes('transit')) return 'in_transit';
  if (status.includes('pickup') || status.includes('dispatch') || status.includes('ship')) return 'dispatched';
  if (status.includes('pack') || status.includes('ready')) return 'packed';
  if (status.includes('confirm')) return 'confirmed';
  return 'placed';
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  events,
  currentStatus,
}) => {
  const normalizedEvents = useMemo(
    () =>
      [...(events || [])]
        .map((event) => ({
          ...event,
          stageKey: normalizeStageKey(event.status),
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [events]
  );

  const currentStageKey = normalizeStageKey(currentStatus);
  const currentStageIndex = STAGE_META.findIndex((stage) => stage.key === currentStageKey);
  const eventLookup = new Map(normalizedEvents.map((event) => [event.stageKey, event]));
  const terminalNegative = ['returned', 'refunded'].includes(currentStageKey);

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Progress Tracker</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Operational Timeline</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Completed, current, and pending stages are mapped from live order tracking events.
            </p>
          </div>
          {terminalNegative && (
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              Exception flow
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-8">
          {STAGE_META.map((stage, index) => {
            const Icon = stage.icon;
            const stageEvent = eventLookup.get(stage.key);
            const isDone = Boolean(stageEvent) || (!terminalNegative && currentStageIndex >= index);
            const isCurrent = stage.key === currentStageKey;
            const tone = isCurrent
              ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/80'
              : isDone
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-400';

            return (
              <div key={stage.key} className={`rounded-[1.25rem] border px-4 py-4 ${tone}`}>
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                    {isCurrent ? 'Current' : isDone ? 'Done' : 'Pending'}
                  </span>
                </div>
                <p className="mt-4 text-sm font-black text-slate-900">{stage.label}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {stageEvent ? formatOrderDateTime(stageEvent.timestamp, 'Recorded') : 'Awaiting stage update'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Event Stream</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Timeline Log</h3>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
            {normalizedEvents.length} events
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {normalizedEvents.length ? (
            normalizedEvents
              .slice()
              .reverse()
              .map((event, index) => {
                const stage = STAGE_META.find((item) => item.key === event.stageKey);
                const Icon = stage?.icon || Clock3;
                const isLatest = index === 0;

                return (
                  <div
                    key={event.id || `${event.status}-${event.timestamp}`}
                    className={`rounded-[1.5rem] border p-5 ${
                      isLatest ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl ${
                          isLatest ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-base font-black capitalize tracking-tight text-slate-900">
                            {String(event.status || '').replace(/_/g, ' ')}
                          </p>
                          {isLatest && (
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {formatOrderDateTime(event.timestamp)}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          {event.notes || 'System update recorded for this order stage.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                          <span className="rounded-full bg-white px-3 py-1.5">Actor: System / Operations</span>
                          {event.location ? (
                            <span className="rounded-full bg-white px-3 py-1.5">Location: {event.location}</span>
                          ) : null}
                          <span className="rounded-full bg-white px-3 py-1.5">Stage: {stage?.label || 'Operational update'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-black tracking-tight text-slate-900">No timeline events yet</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Events will appear here as the order moves through confirmation, packing, dispatch, delivery, and return/refund stages.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
