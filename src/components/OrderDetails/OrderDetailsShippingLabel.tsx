import React from 'react';
import { formatAED } from '../../lib/currency';

interface OrderDetailsShippingLabelProps {
  order: any;
}

export const OrderDetailsShippingLabel: React.FC<OrderDetailsShippingLabelProps> = ({ order }) => {
  const shipmentAddress = order.shippingAddressJson 
    ? (typeof order.shippingAddressJson === 'string' ? JSON.parse(order.shippingAddressJson) : order.shippingAddressJson)
    : order.shippingAddress || {};

  const fullAddress = [
    shipmentAddress.addressLine || '',
    shipmentAddress.building || '',
    shipmentAddress.flat || '',
    shipmentAddress.area || '',
    shipmentAddress.emirate || '',
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-4">
      <div
        id="order-label"
        className="bg-white p-8 border-2 border-black"
        style={{ width: '600px', margin: '0 auto' }}
      >
        {/* Label Header */}
        <div className="mb-6 pb-4 border-b-2 border-black">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-black">ExShopi</h1>
            <p className="text-sm font-semibold">DISPATCH LABEL</p>
          </div>
        </div>

        {/* Order & Tracking Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-bold uppercase text-gray-600">Order ID</p>
            <p className="text-lg font-mono font-bold">{order.orderNumber || order.id}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-600">Tracking Code</p>
            <p className="text-lg font-mono font-bold">{order.trackingCode || 'N/A'}</p>
          </div>
        </div>

        {/* Barcode Area */}
        <div className="border-2 border-black p-4 mb-6 text-center bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">TRACKING BARCODE</p>
          <p className="text-3xl font-mono tracking-widest">{(order.trackingCode || 'EXSHOPI').substring(0, 10)}</p>
        </div>

        {/* From/To */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* From */}
          <div>
            <p className="text-xs font-bold uppercase mb-2 text-gray-600">From (Seller)</p>
            <div className="border border-gray-400 p-3 rounded">
              <p className="font-semibold text-sm">{order.sellerName || 'ExShopi'}</p>
              <p className="text-xs text-gray-700 mt-1">Dubai, UAE</p>
              <p className="text-xs text-gray-700">ExShopi Fulfillment</p>
            </div>
          </div>

          {/* To */}
          <div>
            <p className="text-xs font-bold uppercase mb-2 text-gray-600">To (Customer)</p>
            <div className="border-2 border-black p-3 rounded font-semibold">
              <p className="text-sm">{order.customerName}</p>
              <p className="text-xs mt-2">{fullAddress}</p>
              <p className="text-xs font-mono mt-2">Tel: {order.customerPhone}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
          <div className="border border-gray-300 p-2">
            <p className="font-bold text-gray-600">ITEMS</p>
            <p className="text-lg font-bold">{order.items?.length || 1}</p>
          </div>
          <div className="border border-gray-300 p-2">
            <p className="font-bold text-gray-600">TOTAL VALUE</p>
            <p className="text-lg font-bold">{formatAED(order.totalAmount)}</p>
          </div>
          <div className="border border-gray-300 p-2">
            <p className="font-bold text-gray-600">DELIVERY TYPE</p>
            <p className="font-semibold">{order.deliveryType || 'Standard'}</p>
          </div>
          <div className="border border-gray-300 p-2">
            <p className="font-bold text-gray-600">PAYMENT</p>
            <p className="font-semibold">{order.paymentMethod?.toUpperCase() || 'COD'}</p>
          </div>
        </div>

        {/* Item List */}
        <div className="mb-6 text-xs">
          <p className="font-bold text-gray-600 mb-2">ITEMS ORDERED</p>
          <div className="border border-gray-300">
            {order.items && order.items.map((item: any, idx: number) => (
              <div key={idx} className={`p-2 flex justify-between ${idx > 0 ? 'border-t border-gray-300' : ''}`}>
                <span>{item.quantity}x {item.title?.substring(0, 30)}</span>
                <span className="font-semibold">{formatAED(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
          <div>
            <p className="font-bold text-gray-600">DISPATCH DATE</p>
            <p>{new Date(order.createdAt).toLocaleDateString('en-AE')}</p>
          </div>
          <div>
            <p className="font-bold text-gray-600">COURIER</p>
            <p>{order.courierPartner || 'ExShopi Logistics'}</p>
          </div>
        </div>

        {/* Special Instructions */}
        {order.dispatchNotes && (
          <div className="bg-yellow-50 border border-yellow-300 p-2 mb-6 text-xs">
            <p className="font-bold">SPECIAL NOTES</p>
            <p>{order.dispatchNotes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-black pt-4 text-center text-xs">
          <p className="font-semibold">Please scan this label at pickup</p>
          <p className="text-gray-600 mt-1">For inquiries: support@exshopi.com</p>
          <p className="text-gray-600 text-xs mt-2">✓ Handle with care • ✓ Keep dry • ✓ Deliver as addressed</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p><span className="font-semibold">Print Instructions:</span> Use A4 paper, normal quality, ensure barcode is clear</p>
        <p className="mt-2 text-xs">This label is used for courier pickup and delivery tracking</p>
      </div>
    </div>
  );
};
