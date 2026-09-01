import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from '../components/ProductList';
import { FiSearch, FiFilter } from 'react-icons/fi';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

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
    const interval = setInterval(() => {
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products`)
        .then(res => {
          if (Array.isArray(res.data)) setProducts(res.data);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = products;

    if (selectedCategory !== 'Todos') {
      result = result.filter(p => (p.category || 'Sin Categoría') === selectedCategory);
    }

    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lower) || 
        (p.description && p.description.toLowerCase().includes(lower)) ||
        (p.id && String(p.id).toLowerCase().includes(lower))
      );
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  const availableCategories = Array.from(new Set(products.map(p => p.category || 'Sin Categoría'))).sort();
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 24;

  useEffect(() => {
    // Reset to page 1 whenever search or category changes
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    // Generate page numbers to show (simple logic: show surrounding pages)
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
      <div className="flex justify-center items-center mt-12 mb-4 space-x-2">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        
        {pages.map((p, idx) => (
          <button
            key={idx}
            onClick={() => p !== '...' && handlePageChange(p)}
            disabled={p === '...'}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
              currentPage === p 
                ? 'bg-brand-blue text-white shadow-md' 
                : p === '...' 
                  ? 'bg-transparent text-gray-400 cursor-default'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}

        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      {/* HEADER HERO */}
      <div className="relative bg-brand-blue overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/portada.jpg" 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col justify-center min-h-[300px]">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 max-w-2xl leading-tight">
            Descubre nuestro catálogo <span className="text-brand-red">mayorista</span>
          </h1>
          
          <div className="relative max-w-xl w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar por código, nombre o descripción..."
              className="block w-full pl-11 pr-4 py-4 rounded-xl border-0 ring-4 ring-white/20 focus:ring-brand-red bg-white text-gray-900 placeholder-gray-500 shadow-xl text-lg transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="bg-red-50 border-l-4 border-brand-red p-4 mb-8 rounded-r-md">
            <p className="text-brand-red font-medium">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* FILTROS LATERALES */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-28">
              <div className="flex items-center gap-2 font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 text-lg">
                <FiFilter className="text-brand-blue" />
                Categorías
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('Todos')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === 'Todos' 
                      ? 'bg-brand-red text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-blue'
                  }`}
                >
                  Todos los Productos
                </button>
                
                {availableCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category 
                        ? 'bg-brand-red text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-brand-blue'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LISTA DE PRODUCTOS */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-end">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory === 'Todos' ? 'Catálogo Completo' : selectedCategory}
              </h2>
              <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                {filteredProducts.length} productos
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-brand-blue"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <ProductList products={currentProducts} />
                {renderPagination()}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <FiSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No se encontraron productos</h3>
                <p className="text-gray-500">Intenta buscar con otros términos o cambia de categoría.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
