import React, { useState } from 'react';
import { FiPrinter, FiPlus, FiTrash2, FiFileText } from 'react-icons/fi';

const DispatchTicket = () => {
  const [formData, setFormData] = useState({
    nombres: '',
    cedula: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    referenciaEntrega: '',
    telefonoReferencia: '',
    formaPago: 'Transferencia'
  });

  const [productos, setProductos] = useState([
    { codigo: '', nombre: '', cantidad: 1 }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index, field, value) => {
    const newProductos = [...productos];
    newProductos[index][field] = value;
    setProductos(newProductos);
  };

  const addProductRow = () => {
    setProductos([...productos, { codigo: '', nombre: '', cantidad: 1 }]);
  };

  const removeProductRow = (index) => {
    if (productos.length > 1) {
      setProductos(productos.filter((_, i) => i !== index));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* HEADER (Oculto al imprimir) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiFileText className="text-brand-red" />
          Generar Ticket de Despacho
        </h1>
        <button 
          onClick={handlePrint}
          className="bg-brand-red text-white px-4 py-2 rounded font-semibold flex items-center gap-2 hover:bg-red-700 transition"
        >
          <FiPrinter /> Imprimir PDF
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL DEL TICKET */}
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 print:shadow-none print:border-none print:p-0">
        
        {/* ENCABEZADO TICKET (Visible al imprimir) */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
          <h2 className="text-3xl font-black text-gray-900 tracking-wider">FERRILOPEZ</h2>
          <p className="text-gray-600 font-medium">ORDEN DE DESPACHO Y ENTREGA</p>
          <p className="text-sm text-gray-500 mt-1">Fecha: {new Date().toLocaleDateString()}</p>
        </div>

        {/* SECCIÓN: DATOS DEL CLIENTE */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 mb-4 pb-1 uppercase text-sm">Datos del Cliente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Nombres y Apellidos</label>
              <input 
                type="text" name="nombres" value={formData.nombres} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Cédula / RUC</label>
              <input 
                type="text" name="cedula" value={formData.cedula} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Teléfono Principal</label>
              <input 
                type="text" name="telefono" value={formData.telefono} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Ciudad</label>
              <input 
                type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase">Dirección Exacta</label>
              <input 
                type="text" name="direccion" value={formData.direccion} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN: DATOS DE ENTREGA */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 mb-4 pb-1 uppercase text-sm">Logística y Entrega</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase">Referencias para llegar</label>
              <input 
                type="text" name="referenciaEntrega" value={formData.referenciaEntrega} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
                placeholder="Cerca de..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Teléfono Auxiliar (Referencia)</label>
              <input 
                type="text" name="telefonoReferencia" value={formData.telefonoReferencia} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Forma de Pago</label>
              <select 
                name="formaPago" value={formData.formaPago} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:appearance-none print:border-none print:p-0 print:font-medium print:bg-transparent"
              >
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Contra Entrega">Contra Entrega</option>
                <option value="Tarjeta">Tarjeta / Link de Pago</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN: PRODUCTOS */}
        <div>
          <div className="flex justify-between items-end border-b border-gray-300 mb-4 pb-1">
            <h3 className="font-bold text-gray-800 uppercase text-sm">Productos Solicitados</h3>
            <button 
              onClick={addProductRow}
              className="text-brand-red text-sm font-medium flex items-center gap-1 hover:text-red-800 print:hidden"
            >
              <FiPlus /> Agregar Fila
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs print:bg-gray-200 print:text-black">
                <tr>
                  <th className="px-4 py-2 w-1/4">Código</th>
                  <th className="px-4 py-2 w-1/2">Descripción del Producto</th>
                  <th className="px-4 py-2 w-1/4">Cantidad</th>
                  <th className="px-2 py-2 print:hidden w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productos.map((prod, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2">
                      <input 
                        type="text" 
                        value={prod.codigo} 
                        onChange={(e) => handleProductChange(index, 'codigo', e.target.value)}
                        placeholder="Ej. 000123"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input 
                        type="text" 
                        value={prod.nombre} 
                        onChange={(e) => handleProductChange(index, 'nombre', e.target.value)}
                        placeholder="Nombre completo"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input 
                        type="number" 
                        min="1"
                        value={prod.cantidad} 
                        onChange={(e) => handleProductChange(index, 'cantidad', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
                      />
                    </td>
                    <td className="px-2 py-2 text-center print:hidden">
                      <button 
                        onClick={() => removeProductRow(index)}
                        disabled={productos.length === 1}
                        className={`p-2 rounded text-white ${productos.length === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PIE DE FIRMAS (Solo visible al imprimir o al final) */}
        <div className="mt-16 grid grid-cols-2 gap-8 text-center pt-8 border-t border-gray-200">
          <div>
            <div className="border-b border-gray-400 w-3/4 mx-auto mb-2 h-10"></div>
            <p className="text-xs font-semibold uppercase text-gray-600">Despachado por (Bodega)</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-3/4 mx-auto mb-2 h-10"></div>
            <p className="text-xs font-semibold uppercase text-gray-600">Recibido Conforme (Cliente/Repartidor)</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DispatchTicket;
