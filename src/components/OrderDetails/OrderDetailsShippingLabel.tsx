import React, { useMemo, useState } from 'react';
import { Download, FileText, Printer, ScanLine } from 'lucide-react';
import {
  AdminOrderLike,
  OrderLabelTemplate,
  buildOrderAddress,
  buildOrderLabelHtml,
  downloadOrderInvoicePdf,
  downloadOrderLabelPdf,
  printOrderDocuments,
} from '../../lib/orderAdmin';

interface OrderDetailsShippingLabelProps {
  order: AdminOrderLike;
}

const TEMPLATE_OPTIONS: Array<{ value: OrderLabelTemplate; label: string; note: string }> = [
  { value: 'a4', label: 'A4 Dispatch', note: 'Full operations label for office printers' },
  { value: 'compact', label: '4x6 Courier', note: 'Compact thermal-friendly courier format' },
  { value: 'packing-slip', label: 'Packing Slip', note: 'Internal packing summary for warehouse use' },
];

export const OrderDetailsShippingLabel: React.FC<OrderDetailsShippingLabelProps> = ({ order }) => {
  const [template, setTemplate] = useState<OrderLabelTemplate>('a4');
  const address = useMemo(() => buildOrderAddress(order), [order]);
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Label Workspace</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Dispatch & Shipping Documents</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Print a clean pickup label, download a PDF, or export a packing slip without leaving the order workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTemplate(option.value)}
                className={`rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] transition ${
                  template === option.value
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Order</p>
                <p className="mt-2 text-lg font-black text-slate-900">{order.orderNumber || order.id}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Tracking</p>
                <p className="mt-2 text-lg font-black text-slate-900">{order.trackingCode || 'Pending'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Recipient</p>
                <p className="mt-2 text-base font-black text-slate-900">{order.customerName || 'Customer'}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{order.customerPhone || 'No phone'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Shipment</p>
                <p className="mt-2 text-base font-black text-slate-900">{itemCount} items</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{order.courierPartner || 'Courier pending'}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Destination</p>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                {address.full || 'No delivery address available for this order yet.'}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => printOrderDocuments([order], template)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-600"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={() => downloadOrderLabelPdf(order, template)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                onClick={() => downloadOrderInvoicePdf(order)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" />
                Export Invoice
              </button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Live Preview</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {TEMPLATE_OPTIONS.find((option) => option.value === template)?.note}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                <ScanLine className="h-4 w-4" />
                Print-ready
              </div>
            </div>

            <iframe
              title="Shipping label preview"
              srcDoc={buildOrderLabelHtml(order, template)}
              className="h-[760px] w-full rounded-[1.5rem] border border-slate-200 bg-white"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
