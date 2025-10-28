"use client";
import React, { useEffect, useState } from "react";
import ProductList, { Product } from "../../components/ProductList";
import ProductForm from "../../components/ProductForm";
import Modal from "../../components/Modal";

export default function ProductsIndexPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  // modal/product states for add/edit
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<"add" | "edit">("add");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setProductLoading(true);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) {
        setProducts([]);
      } else {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      setProducts([]);
    }
    setProductLoading(false);
  }

  const handleProductSubmit = async (product: Omit<Product, "id">, id?: number) => {
    setProductLoading(true);
    if (id) {
      await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, id }),
      });
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
    }
    await loadProducts();
    setModalProduct(null);
    setProductModalOpen(false);
    setProductLoading(false);
  };

  const handleProductEdit = (product: Product) => {
    setProductModalMode("edit");
    setModalProduct(product);
    setProductModalOpen(true);
  };
  // Toggle lock/unlock (status) for a product. Calls PATCH /api/products with { id, status }
  const handleProductDelete = async (product: Product) => {
    const newStatus = product.status === 'locked' ? '' : 'locked';
    setProductLoading(true);
    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, status: newStatus }),
    });
    await loadProducts();
    setProductLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-orange-600">Quản Lý Sản Phẩm</h2>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            setProductModalMode("add");
            setModalProduct(null);
            setProductModalOpen(true);
          }}
          className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm"
        >
          Thêm sản phẩm
        </button>
      </div>

      {productLoading ? (
        <div>Đang tải...</div>
      ) : (
        <ProductList products={products} onEdit={handleProductEdit} onDelete={handleProductDelete} />
      )}

      <Modal open={isProductModalOpen} onClose={() => setProductModalOpen(false)} title={productModalMode === "add" ? "Thêm sản phẩm" : "Sửa sản phẩm"}>
        <ProductForm
          onSubmit={async (p, id) => {
            await handleProductSubmit(p, id);
          }}
          editingProduct={modalProduct}
          onCancel={() => setProductModalOpen(false)}
        />
      </Modal>

      {/* delete confirm removed: action is now lock/unlock that updates status column D */}
    </div>
  );
}
