import React from 'react';
import { CheckCircle, Clock, MapPin, Package, Truck, AlertCircle } from 'lucide-react';

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

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  events,
  currentStatus,
  orderId,
}) => {
  const statusSteps = [
    { status: 'pending', label: 'Order Placed', icon: Package },
    { status: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
    { status: 'packed', label: 'Packed', icon: Package },
    { status: 'shipped', label: 'Dispatched', icon: Truck },
    { status: 'in_transit', label: 'In Transit', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const getIconForStatus = (status: string) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('delivered')) return CheckCircle;
    if (statusLower.includes('transit')) return Truck;
    if (statusLower.includes('dispatch')) return Truck;
    if (statusLower.includes('packed')) return Package;
    if (statusLower.includes('confirmed')) return CheckCircle;
    if (statusLower.includes('cancel')) return AlertCircle;
    return Clock;
  };

  const getEventColor = (status: string) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('delivered')) return 'text-emerald-600 bg-emerald-50';
    if (statusLower.includes('transit')) return 'text-amber-600 bg-amber-50';
    if (statusLower.includes('dispatch')) return 'text-amber-600 bg-amber-50';
    if (statusLower.includes('packed')) return 'text-blue-600 bg-blue-50';
    if (statusLower.includes('confirmed')) return 'text-blue-600 bg-blue-50';
    if (statusLower.includes('cancel')) return 'text-rose-600 bg-rose-50';
    return 'text-slate-600 bg-slate-50';
  };

  const sortedEvents = [...(events || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Status Timeline Visual */}
      <div className="bg-slate-50 p-6 rounded-lg">
        <h3 className="font-semibold text-slate-900 mb-4">Delivery Progress</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {statusSteps.map((step, idx) => {
            const isCompleted = statusSteps.findIndex(s => s.status === currentStatus) >= idx;
            const Icon = step.icon;
            return (
              <React.Fragment key={step.status}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <p className="text-xs text-slate-600 mt-2 text-center whitespace-nowrap">
                    {step.label}
                  </p>
                </div>
                {idx < statusSteps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Order Timeline</h3>
        <div className="space-y-3">
          {sortedEvents && sortedEvents.length > 0 ? (
            sortedEvents.map((event, idx) => {
              const Icon = getIconForStatus(event.status);
              return (
                <div key={event.id || idx} className={`rounded-lg p-4 ${getEventColor(event.status)}`}>
                  <div className="flex items-start gap-3">
                    <Icon size={20} className="mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold capitalize text-sm">
                        {String(event.status).replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(event.timestamp).toLocaleString('en-AE')}
                      </p>
                      {event.location && (
                        <p className="text-xs opacity-75 flex items-center gap-1 mt-2">
                          <MapPin size={12} />
                          {event.location}
                        </p>
                      )}
                      {event.notes && (
                        <p className="text-xs mt-2">{event.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-600">
              <p className="text-sm">No timeline events recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p>
          <span className="font-semibold">Current Status:</span> {String(currentStatus).replace(/_/g, ' ')}
        </p>
        <p className="mt-2 text-xs opacity-75">
          Timeline events are updated automatically as the order progresses through each stage.
        </p>
      </div>
    </div>
  );
};
