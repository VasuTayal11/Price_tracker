import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Search, ExternalLink } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      setSearching(true);
      const { data } = await axios.get(`${API_URL}/search?q=${searchQuery}`);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
      alert('Failed to search store');
    } finally {
      setSearching(false);
    }
  };

  const handleTrackProduct = async (product) => {
    try {
      await axios.post(`${API_URL}/products`, {
        name: product.name,
        // Using /product/{slug} based on mock store structure
        url: `https://demo.inelabteamdev.com/product/${product.slug || product.id}` 
      });
      fetchProducts();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add product', error);
      alert('Failed to add product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to stop tracking this product?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Search & Track a Product</h2>
        <form onSubmit={handleSearch} className="flex gap-4 items-end mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Store</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by product name..."
                className="w-full pl-10 border-gray-300 rounded-md shadow-sm border p-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={searching}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 flex items-center gap-2 h-10"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 border rounded-md divide-y">
            {searchResults.map(p => (
              <div key={p.id} className="p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">SKU: {p.sku || p.id}</div>
                </div>
                <button 
                  onClick={() => handleTrackProduct(p)}
                  className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Track
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Tracked Products</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No products tracked yet. Search and add one above!</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map(product => (
              <div key={product.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <a href={product.url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1">
                    View in store <ExternalLink size={12} />
                  </a>
                </div>
                <div className="flex gap-3">
                  <Link 
                    to={`/product/${product.id}`}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    View History
                  </Link>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
