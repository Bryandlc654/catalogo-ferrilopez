import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PDFUpload from '../components/PDFUpload';
import ProductList from '../components/ProductList';
import { AuthContext } from '../context/AuthContext';
import { FiTrash2, FiInfo, FiSearch, FiFilter, FiSettings, FiChevronDown } from 'react-icons/fi';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showAdmin, setShowAdmin] = useState(false);
  
  const { isAuthenticated, token } = useContext(AuthContext);

  const detectCategory = (title) => {
    if (!title) return 'Otros';
    const t = title.toLowerCase();
    if (t.includes('disco') || t.includes('corte')) return 'Discos de Corte';
    if (t.includes('foco') || t.includes('panel') || t.includes('reflector') || t.includes('led')) return 'Iluminación LED';
    if (t.includes('cinta')) return 'Cintas LED';
    if (t.includes('eléctric') || t.includes('cable')) return 'Línea Eléctrica';
    return 'Otros';
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products`);
      if (Array.isArray(response.data)) {
        setProducts(response.data);
        setFilteredProducts(response.data);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('No se pudo conectar con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Auto-refresh en segundo plano cada 3 segundos
    const interval = setInterval(() => {
      // Usamos una versión silenciada para no mostrar el spinner cada vez
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setProducts(res.data);
          }
          // Actualización silenciosa de los productos
        })
        .catch(() => {});
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = products;

    // Filter by Category
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => detectCategory(p.title) === selectedCategory);
    }

    // Filter by Search Term
    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lower) || 
        (p.description && p.description.toLowerCase().includes(lower))
      );
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  // Calcular conteo de categorías
  const categoryCounts = products.reduce((acc, p) => {
    const cat = detectCategory(p.title);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  
  const availableCategories = Object.keys(categoryCounts).sort();

  const handleClearCatalog = async () => {
    if(window.confirm('¿Estás seguro de que quieres limpiar todo el catálogo?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch(err) {
        alert('Error limpiando el catálogo. Revisa si tu sesión ha expirado.');
      }
    }
  };

  return (
    <div className="flex flex-col flex-grow w-full bg-gray-50">
      {/* Hero Banner Ecommerce */}
      <div className="relative w-full h-96 md:h-[35rem] lg:h-[45rem] bg-gray-200 bg-[url('/portada.jpg')] bg-cover bg-center bg-no-repeat flex items-end justify-center pb-12 md:pb-20 shadow-inner">
        {/* Capa de oscurecimiento sutil (opcional, para que resalte la barra de búsqueda) */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative z-10 w-full max-w-4xl px-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 text-2xl" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por código, producto o aplicación..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-5 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] border border-white/50 focus:outline-none focus:ring-4 focus:ring-brand-yellow/80 text-gray-800 text-xl transition-all bg-white/95 backdrop-blur-sm placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        
        {/* Filtros Horizontales Flotantes */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-4 mb-8 custom-scrollbar hide-scrollbar-mobile">
           <button 
             onClick={() => setSelectedCategory('Todos')}
             className={`flex items-center px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all shadow-sm ${selectedCategory === 'Todos' ? 'bg-brand-red text-white border-transparent' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'}`}
           >
             Todos ({products.length})
           </button>
           
           {availableCategories.map(cat => (
             <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`flex items-center px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all shadow-sm ${selectedCategory === cat ? 'bg-brand-red text-white border-transparent' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'}`}
             >
               {cat} ({categoryCounts[cat]})
             </button>
           ))}
        </div>

        {/* Contenido Principal */}
        <div className="w-full">
          
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scrollbar-mobile::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar-mobile {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}} />
          
          {/* Admin Panel (Colapsable) */}
          {isAuthenticated && (
            <div className="mb-8 bg-white rounded-2xl shadow-sm border border-brand-blue/20 overflow-hidden">
               <div 
                 className="bg-blue-50/50 p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors"
                 onClick={() => setShowAdmin(!showAdmin)}
               >
                 <h2 className="text-sm font-bold text-brand-blue flex items-center uppercase tracking-widest">
                   <FiSettings className="mr-2 text-brand-red"/> Panel de Administración
                 </h2>
                 <FiChevronDown className={`text-brand-blue transition-transform duration-300 ${showAdmin ? 'rotate-180' : ''}`} />
               </div>
               
               {showAdmin && (
                 <div className="p-6 border-t border-brand-blue/10 animate-fade-in">
                   <div className="flex justify-end mb-4">
                     {products.length > 0 && (
                      <button 
                        onClick={handleClearCatalog}
                        className="flex items-center text-xs bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 px-4 rounded-lg transition-colors font-bold shadow-sm"
                      >
                        <FiTrash2 className="mr-2"/> Vaciar Base de Datos
                      </button>
                     )}
                   </div>
                   <PDFUpload onProductsExtracted={fetchProducts} />
                 </div>
               )}
            </div>
          )}

          {!isAuthenticated && products.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <h2 className="text-2xl font-bold text-gray-400">El catálogo está vacío.</h2>
               <p className="text-gray-500 mt-2">Vuelve pronto para ver nuestros nuevos productos.</p>
            </div>
          )}
          
          {error && (
            <div className="mb-8 p-5 bg-red-50 text-brand-red rounded-xl border border-red-200 flex items-center shadow-sm">
              <span className="font-semibold text-lg">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center py-32">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-yellow mb-4"></div>
              <p className="text-brand-blue font-semibold text-lg animate-pulse">Cargando catálogo...</p>
            </div>
          ) : (
            <ProductList products={filteredProducts} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Catalog;
