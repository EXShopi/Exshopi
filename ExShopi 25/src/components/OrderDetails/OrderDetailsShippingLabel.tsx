import React from 'react';

export interface OrderDetailsShippingLabelProps {
  orderId?: string;
  onPrint?: () => void;
}

export const OrderDetailsShippingLabel: React.FC<OrderDetailsShippingLabelProps> = ({
  orderId,
  onPrint,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Shipping Label</h3>
      <p className="text-slate-600 mb-4">Order ID: {orderId}</p>
      {onPrint && (
        <button
          onClick={onPrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Print Label
        </button>
      )}
    </div>
  );
};
