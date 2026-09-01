import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiEdit2, FiTrash2, FiFileText, FiUploadCloud, FiPackage, FiPlus } from 'react-icons/fi';
import PDFUpload from '../components/PDFUpload';
import DispatchTicket from './DispatchTicket';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means creating new
  const [formData, setFormData] = useState({ title: '', price: '', category: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 15;

  const { token } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);

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

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setTickets(response.data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'ticket-history') {
      fetchTickets();
    }
  }, [activeTab]);

  const categories = Array.from(new Set(products.map(p => p.category || 'Sin Categoría'))).sort();

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setFormData({
        title: product.title || '',
        price: product.price || '',
        category: product.category || 'Sin Categoría',
        description: product.description || ''
      });
    } else {
      setFormData({ title: '', price: '', category: categories[0] || 'Sin Categoría', description: '' });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImageFile(null);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('price', formData.price);
    data.append('category', formData.category === 'Otra...' ? formData.newCategory : formData.category);
    data.append('description', formData.description);
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (editingProduct) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products/${editingProduct.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Producto actualizado exitosamente');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Producto creado exitosamente');
      }
      handleCloseModal();
      fetchProducts();
    } catch (err) {
      alert('Error guardando el producto');
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Eliminar este producto permanentemente?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch (err) {
        alert('Error eliminando producto');
      }
    }
  };

  const handleClearCatalog = async () => {
    if(window.confirm('¿Estás seguro de que quieres limpiar TODO el catálogo? Esta acción borrará todas las imágenes de R2 y no se puede deshacer.')) {
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

  // Pagination Logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    let pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages = [1, 2, 3, 4, 5, '...', totalPages];
      } else if (currentPage >= totalPages - 3) {
        pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }

    return (
      <div className="flex justify-center items-center p-4 border-t border-gray-200 bg-white space-x-1">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border disabled:opacity-50 text-sm">Ant</button>
        {pages.map((p, idx) => (
          <button key={idx} onClick={() => p !== '...' && setCurrentPage(p)} disabled={p === '...'} className={`w-8 h-8 rounded text-sm ${currentPage === p ? 'bg-brand-blue text-white' : p === '...' ? 'cursor-default text-gray-400' : 'bg-white border hover:bg-gray-50'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border disabled:opacity-50 text-sm">Sig</button>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-50">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col print:hidden shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Panel de Control</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeTab === 'products' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FiPackage /> Inventario
          </button>
          <button onClick={() => setActiveTab('pdf')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeTab === 'pdf' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FiUploadCloud /> Subir Catálogo (PDF)
          </button>
          <button onClick={() => setActiveTab('ticket')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeTab === 'ticket' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FiFileText /> Crear Ticket
          </button>
          <button onClick={() => setActiveTab('ticket-history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${activeTab === 'ticket-history' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FiFileText /> Historial de Tickets
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
              <div className="flex gap-3">
                <button onClick={() => handleOpenModal()} className="bg-brand-blue text-white px-4 py-2 rounded font-semibold flex items-center gap-2 hover:bg-blue-900 transition">
                  <FiPlus /> Añadir Producto
                </button>
                <button onClick={handleClearCatalog} className="bg-red-100 text-red-700 px-4 py-2 rounded font-semibold hover:bg-red-200 transition">
                  Limpiar Catálogo
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-24">Imagen</th>
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
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No hay productos. Sube un PDF o crea uno manual.</td></tr>
                  ) : (
                    currentProducts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-2">
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                            {p.imageUrl ? (
                              <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${p.imageUrl}`} alt="img" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-gray-400">Sin foto</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900">{p.title}</td>
                        <td className="px-6 py-3">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                            {p.category || 'Sin Categoría'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">${p.price}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenModal(p)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition" title="Editar">
                              <FiEdit2 />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition" title="Eliminar">
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {renderPagination()}
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
            <DispatchTicket products={products} />
          </div>
        )}

        {/* TAB 4: HISTORIAL DE TICKETS */}
        {activeTab === 'ticket-history' && (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Historial de Tickets Generados</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Código</th>
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Ciudad</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Productos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No hay tickets generados todavía.</td></tr>
                  ) : (
                    tickets.map(t => {
                      let prods = [];
                      try { prods = JSON.parse(t.products || '[]'); } catch(e) {}
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-brand-blue">{t.ticket_code}</td>
                          <td className="px-6 py-3 font-bold">{t.client_name || '-'}</td>
                          <td className="px-6 py-3">{t.city || '-'}</td>
                          <td className="px-6 py-3 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="px-6 py-3 text-xs text-gray-600">
                            {prods.map((p, i) => (
                              <div key={i}>{p.cantidad}x {p.nombre}</div>
                            ))}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800">{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Producto</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Precio ($)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Otra...">Crear nueva categoría...</option>
                  </select>
                  {formData.category === 'Otra...' && (
                    <input 
                      type="text" placeholder="Nueva categoría" required
                      value={formData.newCategory || ''}
                      onChange={e => setFormData({...formData, newCategory: e.target.value})}
                      className="w-full p-2 mt-2 border border-brand-red rounded-lg focus:ring-2 focus:ring-brand-blue"
                    />
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Foto del Producto (Opcional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue text-sm"
                />
                {editingProduct && editingProduct.imageUrl && !imageFile && (
                  <p className="text-xs text-gray-500 mt-1">Sube un archivo solo si deseas reemplazar la foto actual.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción / Especificaciones</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3 justify-end shrink-0">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-brand-blue text-white font-medium rounded-lg hover:bg-blue-900 transition shadow-md">
                  Guardar Producto
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
