import React, { useState } from 'react';
import { FiImage, FiShoppingCart, FiX } from 'react-icons/fi';

const ProductList = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24 bg-white border border-gray-100">
        <div className="inline-block p-4 mb-4">
          <FiShoppingCart className="mx-auto text-4xl text-gray-200" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Tu catálogo está vacío</h3>
        <p className="text-gray-400 font-light text-sm">Sube un archivo PDF en la parte superior para comenzar.</p>
      </div>
    );
  }

  const renderDescription = (descString) => {
    if (!descString) return null;
    
    try {
      const data = JSON.parse(descString);
      
      return (
        <div className="space-y-4 text-[13px] font-light text-gray-600">
          {/* Categoría & Subcategoría */}
          {(data.categoria || data.subcategoria) && (
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {data.categoria} {data.subcategoria ? `> ${data.subcategoria}` : ''}
            </div>
          )}
          
          {/* Descripción / Modelo */}
          {data.descripcion && <p className="leading-relaxed">{data.descripcion}</p>}
          
          {/* Especificaciones */}
          {(data.especificaciones || data.especificaciones_generales) && (
            <div className="pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900 block mb-2">Especificaciones</span>
              <div className="space-y-1.5">
                {Object.entries(data.especificaciones || data.especificaciones_generales).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-50 pb-1">
                    <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900">{typeof v === 'object' ? JSON.stringify(v) : v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Variantes (Tabla) */}
          {data.variantes && data.variantes.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900 block mb-2">Variantes</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] whitespace-nowrap border border-gray-200">
                  <thead className="bg-gray-100 text-gray-500">
                    <tr>
                      {Object.keys(data.variantes[0]).map(key => (
                        <th key={key} className="px-2 py-1.5 capitalize font-semibold border-b border-gray-200">{key.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {data.variantes.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {Object.values(v).map((val, idx) => (
                          <td key={idx} className="px-2 py-1.5 font-medium text-gray-800">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Código individual (si no tiene variantes) */}
          {!data.variantes && data.codigo && (
            <div className="pt-2 flex items-center">
              <span className="font-semibold text-gray-900 mr-2">Código:</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs tracking-wider">{data.codigo}</span>
            </div>
          )}
        </div>
      );
    } catch (e) {
      return (
        <div className="text-gray-500 text-[13px] font-light leading-relaxed whitespace-pre-wrap">
          {descString}
        </div>
      );
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Catálogo <span className="text-gray-400 font-light ml-2">({products.length})</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              onClick={() => setSelectedProduct(product)}
              className="bg-white group relative flex flex-col h-full border border-gray-200 hover:border-gray-900 transition-colors duration-300 cursor-pointer"
            >
              
              {/* Imagen Limpia */}
              <div className="h-[22rem] p-3 flex items-center justify-center relative bg-white group-hover:bg-gray-50/50 transition-colors">
                <div className="absolute top-4 left-4 border border-gray-900 text-gray-900 text-[9px] font-bold uppercase tracking-widest px-2 py-1 z-10">
                  Nuevo
                </div>
                
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl.startsWith('http') ? product.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.imageUrl}`}
                    alt={product.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] mix-blend-multiply"
                    onError={(e) => {
                      e.target.onerror = null;
                      // En lugar de llamar a una URL externa que causa ERR_CONNECTION_CLOSED, ponemos un SVG local incrustado
                      e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%239ca3af'%3ESin Imagen%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <FiImage className="text-4xl text-gray-200" />
                )}
              </div>
              
              {/* Texto y Contenido */}
              <div className="px-6 pb-6 pt-2 flex flex-col flex-grow relative bg-white">
                <h3 className="font-semibold text-base text-gray-900 mb-4 leading-snug line-clamp-2" title={product.title}>
                  {product.title}
                </h3>
                
                <div className="flex-grow mb-6 relative">
                  <div className="overflow-y-auto max-h-[12rem] pr-2 custom-scrollbar">
                    {renderDescription(product.description)}
                  </div>
                  {/* Gradiente inferior muy sutil para indicar scroll */}
                  <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>

                {/* Pie de Tarjeta Minimalista */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="font-semibold text-lg text-gray-900">
                    {product.price > 0 ? `$${product.price.toFixed(2)}` : 'Consultar'}
                  </span>
                  
                  <button 
                    className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar abrir modal si solo quiere añadir al carrito (futuro)
                      alert('Añadir al carrito: ' + product.title);
                    }}
                  >
                    <FiShoppingCart className="text-xl" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #e5e7eb;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
        `}} />
      </div>

      {/* MODAL DE PRODUCTO */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md border border-gray-200 hover:bg-gray-100 rounded-full text-gray-900 transition-colors z-20 shadow-sm"
            >
              <FiX className="text-xl" />
            </button>

            {/* Mitad Imagen */}
            <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-8 min-h-[300px] md:min-h-[500px] relative">
              {selectedProduct.imageUrl ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedProduct.imageUrl}`}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain mix-blend-multiply"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/600x400?text=Sin+Imagen';
                  }}
                />
              ) : (
                <FiImage className="text-6xl text-gray-200" />
              )}
            </div>

            {/* Mitad Info */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col bg-white">
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Detalle del Producto</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 leading-tight">
                {selectedProduct.title}
              </h2>
              
              <div className="flex-grow">
                {renderDescription(selectedProduct.description)}
              </div>

              <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between">
                <span className="font-bold text-3xl text-gray-900">
                  {selectedProduct.price > 0 ? `$${selectedProduct.price.toFixed(2)}` : 'A Consultar'}
                </span>
                
                <button className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 transition-colors flex items-center">
                  <FiShoppingCart className="mr-2" />
                  Cotizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductList;
