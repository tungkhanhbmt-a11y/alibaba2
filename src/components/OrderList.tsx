import React, { useMemo } from 'react';

export interface Order {
  date: string;
  branch: string;
  name: string;
  unit: string;
  quantity: string;
  price: string;
  total: string;
  note: string;
}

interface Props {
  orders: Order[];
}

export default function OrderList({ orders }: Props) {
  const { grandTotalNum, grandTotalDisplay } = useMemo(() => {
    const totalNum = orders.reduce((acc, o) => {
      const v = Number(String(o.total).replace(/[^0-9.-]+/g, '')) || 0;
      return acc + v;
    }, 0);
    const decimalsList = orders.map((o) => {
      const m = String(o.total).match(/\.(\d+)$/);
      return m ? m[1].length : 0;
    });
    const maxDecimals = orders.length ? Math.max(0, ...decimalsList) : 0;
    const s = totalNum.toFixed(maxDecimals);
    const [intPart, fracPart] = s.split('.');
    const intWithDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const display = maxDecimals > 0 ? `${intWithDots}.${fracPart}` : intWithDots;
    return { grandTotalNum: totalNum, grandTotalDisplay: display };
  }, [orders]);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr className="text-sm text-gray-600">
              <th className="text-left px-4 py-3">Ngày</th>
              <th className="text-left px-4 py-3">Chi nhánh</th>
              <th className="text-left px-4 py-3">Tên</th>
              <th className="text-left px-4 py-3">ĐVT</th>
              <th className="text-right px-4 py-3">Số lượng</th>
              <th className="text-right px-4 py-3">Giá</th>
              <th className="text-right px-4 py-3">Thành tiền</th>
              <th className="text-left px-4 py-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-3 text-sm text-gray-700">{order.date}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.branch}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.unit}</td>
                <td className="px-4 py-3 text-sm text-right">{order.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">{order.price}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold">{order.total}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{order.note}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-white">
              <td colSpan={6} className="px-4 py-3 text-right font-semibold text-gray-700">Tổng</td>
              <td className="px-4 py-3 text-right font-semibold">{grandTotalDisplay} </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
