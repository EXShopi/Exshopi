import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  specs?: any;
  status: 'published' | 'draft' | 'rejected' | 'pending';
  stockQuantity: number;
  sales: number;
  image: string;
  createdAt: any;
  variants?: any[];
}

export function SellerProducts() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const sellerId = user.id || (user as any).uid;
        const prods = await productAPI.getSellerProducts(sellerId);
        setProducts(prods || []);
        const cats = Array.from(
          new Set(
            (prods || [])
              .map((p: any) => p.specs?.categoryName || p.specs?.parentCategoryName || p.category)
              .filter(Boolean)
          )
        ) as string[];
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load seller products', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productAPI.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    try {
      await Promise.all(selectedProducts.map(id => productAPI.delete(id)));
      setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const title = product.title || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const productCategoryLabel = (product as any).specs?.categoryName || (product as any).specs?.parentCategoryName || product.category || '';
    const matchesCategory = categoryFilter === 'all' || productCategoryLabel === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'pending': return <Clock className="w-3 h-3 mr-1" />;
      case 'rejected': return <AlertCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">My Products</h2>
          <p className="text-slate-500 font-medium mt-1">Manage and monitor your store inventory</p>
        </div>
        <Link 
          to="/seller/add-product"
          className="inline-flex items-center justify-center bg-violet-600 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-violet-600/20 hover:bg-violet-700 hover:-translate-y-1 transition-all group"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
          Add New Product
        </Link>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-bottom border-slate-50 bg-slate-50/30">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-slate-600"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-slate-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
              {selectedProducts.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl hover:bg-rose-100 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete ({selectedProducts.length})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-5 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(filteredProducts.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  />
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Variants</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Stock</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                      <p className="text-slate-500 text-sm mt-1">Start by adding your first product to the marketplace.</p>
                      <Link 
                        to="/seller/add-product"
                        className="mt-6 text-violet-600 font-bold text-sm hover:underline"
                      >
                        Add your first product &rarr;
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedProducts.includes(product.id) ? 'bg-violet-50/30' : ''}`}>
                    <td className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">{product.title}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">{(product as any).specs?.categoryName || (product as any).specs?.parentCategoryName || product.category}</span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-900">AED {product.price.toFixed(2)}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {product.variants && product.variants.length > 0 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-600 text-[10px] font-black">
                          {product.variants.length}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">None</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${(product.stockQuantity || 0) > 10 ? 'bg-emerald-500' : (product.stockQuantity || 0) > 0 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        <p className="font-bold text-slate-700 text-sm">{product.stockQuantity || 0}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(product.status)}`}>
                        {getStatusIcon(product.status)}
                        {product.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/seller/add-product?edit=${product.id}`}
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
