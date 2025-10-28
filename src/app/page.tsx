

"use client";
import { useEffect, useState } from "react";
import OrderForm from "../components/OrderForm";
import type { OrderInput } from "../components/OrderForm";
import InvoiceList from "../components/InvoiceList";
import type { InvoiceSummary } from "../components/InvoiceList";
import InvoiceEditModal from "../components/InvoiceEditModal";
// products are managed on /products route now

async function fetchInvoices(): Promise<InvoiceSummary[]> {
  const res = await fetch("/api/invoices");
  if (!res.ok) return [];
  return await res.json();
}

async function submitOrder(order: OrderInput) {
  await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
}


export default function Home() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // products are managed on /products route

  useEffect(() => {
    // load invoices on home page
    setLoading(true);
    fetchInvoices().then((data) => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (order: OrderInput) => {
    setLoading(true);
    await submitOrder(order);
    const data = await fetchInvoices();
    setInvoices(data);
    setLoading(false);
  };

  async function handleDelete(id: string) {
    if (!confirm(`Xóa hóa đơn ${id} ?`)) return;
    setLoading(true);
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    const data = await fetchInvoices();
    setInvoices(data);
    setLoading(false);
  }

  function handleEdit(id: string) {
    setEditing(id);
  }

  function closeEditor() {
    setEditing(null);
    fetchInvoices().then((data) => setInvoices(data));
  }

  // products are managed on /products route

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-orange-600">Bán hàng</h2>
      <OrderForm onSubmit={handleSubmit} />
      <hr className="my-6" />
      <h3 className="text-lg font-semibold mb-2">Danh sách hóa đơn</h3>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <InvoiceList invoices={invoices} onEdit={handleEdit} onView={(id) => setPreviewing(id)} onDelete={handleDelete} />
      )}

      {editing && (
        <InvoiceEditModal invoiceId={editing} open={true} onClose={closeEditor} onSaved={closeEditor} />
      )}

      {previewing && (
        <InvoiceEditModal invoiceId={previewing} open={true} onClose={() => setPreviewing(null)} readOnly={true} />
      )}
    </div>
  );
}
