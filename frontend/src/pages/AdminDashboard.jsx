import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiEdit2, FiTrash2, FiFileText, FiUploadCloud, FiPackage } from 'react-icons/fi';
import PDFUpload from '../components/PDFUpload';
import DispatchTicket from './DispatchTicket'; // We will reuse the component

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'pdf', 'ticket'
  
  // Product Management State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const { token } = useContext(AuthContext);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products`);
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products/${editingProduct.id}`, {
        title: editingProduct.title,
        description: editingProduct.description,
        price: editingProduct.price,
        category: editingProduct.category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingProduct(null);
      fetchProducts();
      alert('Producto actualizado exitosamente');
    } catch (err) {
      alert('Error actualizando producto');
    }
  };

  const handleClearCatalog = async () => {
    if(window.confirm('¿Estás seguro de que quieres limpiar TODO el catálogo? Esta acción no se puede deshacer.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
        alert('Catálogo limpiado');
      } catch(err) {
        alert('Error limpiando el catálogo.');
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-50">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col print:hidden shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Panel de Control</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeTab === 'products' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FiPackage /> Inventario
          </button>
          <button 
            onClick={() => setActiveTab('pdf')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeTab === 'pdf' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FiUploadCloud /> Subir Catálogo (PDF)
          </button>
          <button 
            onClick={() => setActiveTab('ticket')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeTab === 'ticket' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FiFileText /> Ticket de Despacho
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-auto bg-gray-50">
        
        {/* TAB 1: GESTIÓN DE PRODUCTOS */}
        {activeTab === 'products' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h1>
              <button 
                onClick={handleClearCatalog}
                className="bg-red-100 text-red-700 px-4 py-2 rounded font-semibold hover:bg-red-200 transition"
              >
                Limpiar todo el catálogo
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Código</th>
                    <th className="px-6 py-4 font-semibold">Producto</th>
                    <th className="px-6 py-4 font-semibold">Categoría</th>
                    <th className="px-6 py-4 font-semibold">Precio</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">Cargando productos...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No hay productos en el catálogo. Sube un PDF.</td></tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{p.id}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{p.title}</td>
                        <td className="px-6 py-3">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                            {p.category || 'Sin Categoría'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">${p.price}</td>
                        <td className="px-6 py-3 text-right">
                          <button 
                            onClick={() => setEditingProduct(p)}
                            className="text-blue-600 hover:text-blue-800 p-2"
                            title="Editar"
                          >
                            <FiEdit2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PDF UPLOAD */}
        {activeTab === 'pdf' && (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Importar Catálogo (PDF con IA)</h1>
            <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <PDFUpload onUploadSuccess={fetchProducts} />
            </div>
          </div>
        )}

        {/* TAB 3: TICKETS */}
        {activeTab === 'ticket' && (
          <div className="w-full h-full">
            <DispatchTicket />
          </div>
        )}

      </div>

      {/* MODAL DE EDICIÓN DE PRODUCTO */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Editar Producto</h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Producto</label>
                <input 
                  type="text" 
                  value={editingProduct.title}
                  onChange={e => setEditingProduct({...editingProduct, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Precio ($)</label>
                  <input 
                    type="number" step="0.01"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                  <input 
                    type="text" 
                    value={editingProduct.category || ''}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                    placeholder="Ej. Herramientas"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción / Especificaciones</label>
                <textarea 
                  rows="4"
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-brand-blue text-white font-medium rounded-lg hover:bg-blue-900 transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
