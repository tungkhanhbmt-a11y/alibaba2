"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductForm from "../../../components/ProductForm";
import Modal from "../../../components/Modal";

interface Product {
  id: number;
  name: string;
  unit: string;
  price: string;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const idStr = params?.id as string | undefined;
  const id = idStr ? parseInt(idStr, 10) : NaN;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        if (!res.ok) {
          setProduct(null);
          setLoading(false);
          return;
        }
        const data: Product[] = await res.json();
        const p = data.find((x) => x.id === id) || null;
        setProduct(p);
      } catch (e) {
        setProduct(null);
      }
      setLoading(false);
    }
    if (!isNaN(id)) load();
  }, [id]);

  async function handleUpdate(updated: Omit<Product, "id">, _maybeId?: number) {
    if (!product) return;
    setLoading(true);
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updated, id: product.id }),
    });
    const data = await fetch("/api/products").then((r) => r.json());
    const p = data.find((x: Product) => x.id === product.id) || null;
    setProduct(p);
    setEditOpen(false);
    setLoading(false);
  }

  async function handleDelete() {
    if (!product) return;
    setLoading(true);
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id }),
    });
    setLoading(false);
    // navigate back to products list
    router.push("/");
  }

  if (isNaN(id)) return <div className="p-4">ID sản phẩm không hợp lệ.</div>;

  return (
    <div className="p-4">
      <div className="max-w-2xl">
        <button className="text-sm text-blue-600 mb-4" onClick={() => router.push("/")}>← Quay lại</button>

        {loading && <div>Đang tải...</div>}

        {!loading && !product && <div className="text-gray-500">Không tìm thấy sản phẩm.</div>}

        {!loading && product && (
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            <div className="text-sm text-gray-600 mb-3">Đơn vị: {product.unit}</div>
            <div className="text-lg font-medium mb-4">Giá: {product.price}</div>

            <div className="flex gap-2">
              <button onClick={() => setEditOpen(true)} className="bg-yellow-500 text-white px-3 py-2 rounded-md">Sửa</button>
              <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-2 rounded-md">Xóa</button>
            </div>
          </div>
        )}

        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Sửa sản phẩm">
          <ProductForm
            editingProduct={product}
            onSubmit={async (p, _id) => {
              await handleUpdate(p, _id);
            }}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      </div>
    </div>
  );
}
