import React from 'react';

export interface OrderStatusTimelineProps {
  status?: string;
  orderId?: string;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  status,
  orderId,
}) => {
  const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentIndex = statuses.findIndex((s) => s.toLowerCase() === (status || '').toLowerCase());

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Order Timeline</h3>
      <div className="space-y-4">
        {statuses.map((s, index) => (
          <div key={s} className="flex items-start gap-4">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                index <= currentIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {index + 1}
            </div>
            <div className="pt-1">
              <div className={`font-semibold ${index <= currentIndex ? 'text-slate-900' : 'text-slate-500'}`}>
                {s}
              </div>
            </div>
            {index < statuses.length - 1 && (
              <div className="absolute left-3.5 top-12 h-4 w-0.5 bg-slate-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
