import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, RefreshCw, AlertCircle, Play } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function ProductDetail() {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/products/${id}/history`),
        axios.get(`${API_URL}/products/${id}/logs`)
      ]);
      setHistory(histRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestScrape = async () => {
    try {
      setScraping(true);
      await axios.post(`${API_URL}/products/${id}/scrape-headed`);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to trigger scrape', error);
      alert('Scrape failed. Check logs.');
    } finally {
      setScraping(false);
    }
  };

  const chartData = history.map(h => ({
    time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: parseFloat(h.price) || 0,
    fullDate: new Date(h.created_at).toLocaleString()
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        <button 
          onClick={handleTestScrape}
          disabled={scraping}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          {scraping ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
          {scraping ? 'Running Scraper...' : 'Test Scrape (Headed)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Price History</h2>
            {history.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Price']}
                      labelFormatter={(label, items) => {
                        return items[0]?.payload.fullDate || label;
                      }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-200">
                No price history recorded yet.
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Stock Status Table</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ${record.price}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.stock_status?.toLowerCase().includes('in stock') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.stock_status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-sm text-gray-500">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
            <h2 className="text-lg font-semibold mb-4">Scrape Logs</h2>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {logs.map((log) => (
                <div key={log.id} className="border-l-4 pl-4 py-2 border-gray-200 rounded-r-md bg-gray-50"
                  style={{ 
                    borderLeftColor: log.status === 'success' ? '#22c55e' : 
                                    log.status === 'retried' ? '#eab308' : '#ef4444' 
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold uppercase ${
                      log.status === 'success' ? 'text-green-600' : 
                      log.status === 'retried' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-gray-700 mt-2 bg-white p-2 rounded border border-red-100 flex gap-2 items-start">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                      <span className="font-mono break-all">{log.error_message}</span>
                    </p>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">No scrape logs found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
