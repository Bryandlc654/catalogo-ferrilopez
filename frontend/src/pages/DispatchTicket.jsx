import React, { useState } from 'react';
import { FiPrinter, FiPlus, FiTrash2, FiFileText, FiDownload, FiSave } from 'react-icons/fi';
import html2pdf from 'html2pdf.js';

const DispatchTicket = ({ products = [] }) => {
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
    { codigo: '', nombre: '', cantidad: 1, showSearch: false }
  ]);

  const [ticketCode, setTicketCode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index, field, value) => {
    const newProductos = [...productos];
    newProductos[index][field] = value;
    if (field === 'nombre') {
      newProductos[index].showSearch = true;
    }
    setProductos(newProductos);
  };

  const handleSelectProduct = (index, product) => {
    const newProductos = [...productos];
    // Attempt to extract real code from JSON description
    let code = product.id;
    try {
      const data = JSON.parse(product.description);
      if (data.codigo) code = data.codigo;
    } catch(e) {}
    
    newProductos[index].nombre = product.title;
    newProductos[index].codigo = code;
    newProductos[index].showSearch = false;
    setProductos(newProductos);
  };

  const addProductRow = () => {
    setProductos([...productos, { codigo: '', nombre: '', cantidad: 1, showSearch: false }]);
  };

  const removeProductRow = (index) => {
    if (productos.length > 1) {
      setProductos(productos.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ formData, productos })
      });
      const data = await response.json();
      if (response.ok) {
        setTicketCode(data.ticket_code);
        alert(`Ticket guardado exitosamente: ${data.ticket_code}`);
      } else {
        alert('Error guardando el ticket: ' + (data.detail || ''));
      }
    } catch(err) {
      alert('Error de conexión al guardar el ticket');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    
    // Wait for React to re-render the DOM with text instead of inputs
    setTimeout(() => {
      const element = document.getElementById('ticket-content');
      const opt = {
        margin: 10,
        filename: `Ticket_${ticketCode || 'Nuevo'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
          setIsGeneratingPdf(false);
      });
    }, 100);
  };

  const handlePrint = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      window.print();
      setIsGeneratingPdf(false);
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* HEADER (Oculto al imprimir) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiFileText className="text-brand-red" />
          Generar Ticket de Despacho
        </h1>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold flex items-center gap-2 hover:bg-green-700 transition disabled:opacity-50"
          >
            <FiSave /> {isSaving ? 'Guardando...' : 'Guardar Ticket'}
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold flex items-center gap-2 hover:bg-blue-800 transition"
          >
            <FiDownload /> Descargar PDF
          </button>
          <button 
            onClick={handlePrint}
            className="bg-gray-800 text-white px-4 py-2 rounded font-semibold flex items-center gap-2 hover:bg-black transition"
          >
            <FiPrinter /> Imprimir
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL DEL TICKET */}
      <div id="ticket-content" className="bg-white p-8 rounded-lg shadow-md border border-gray-200 print:shadow-none print:border-none print:p-0">
        
        {/* ENCABEZADO TICKET (Visible al imprimir) */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
          <h2 className="text-3xl font-black text-gray-900 tracking-wider">FERRILOPEZ</h2>
          <p className="text-gray-600 font-medium">ORDEN DE DESPACHO Y ENTREGA</p>
          <div className="flex justify-center items-center gap-4 mt-2">
            <p className="text-sm text-gray-500 font-medium">Fecha: {new Date().toLocaleDateString()}</p>
            {ticketCode && (
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded font-bold border border-gray-300">
                {ticketCode}
              </span>
            )}
          </div>
        </div>

        {/* SECCIÓN: DATOS DEL CLIENTE */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 mb-4 pb-1 uppercase text-sm">Datos del Cliente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Nombres y Apellidos</label>
              {isGeneratingPdf ? <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{formData.nombres || '-'}</div> : 
              <input 
                type="text" name="nombres" value={formData.nombres} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
                placeholder="Ej. Juan Pérez"
              />}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Cédula / RUC</label>
              {isGeneratingPdf ? <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{formData.cedula || '-'}</div> :
              <input 
                type="text" name="cedula" value={formData.cedula} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Teléfono Principal</label>
              {isGeneratingPdf ? <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{formData.telefono || '-'}</div> :
              <input 
                type="text" name="telefono" value={formData.telefono} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Ciudad</label>
              {isGeneratingPdf ? <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{formData.ciudad || '-'}</div> :
              <input 
                type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase">Dirección Exacta</label>
              {isGeneratingPdf ? <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{formData.direccion || '-'}</div> :
              <textarea 
                rows="2"
                name="direccion" value={formData.direccion} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium resize-none"
              ></textarea>}
            </div>
          </div>
        </div>

        {/* SECCIÓN: DATOS DE ENTREGA */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 mb-4 pb-1 uppercase text-sm">Logística y Entrega</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase">Referencias para llegar</label>
              {isGeneratingPdf ? <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{formData.referenciaEntrega || '-'}</div> :
              <textarea 
                rows="2"
                name="referenciaEntrega" value={formData.referenciaEntrega} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium resize-none"
                placeholder="Cerca de..."
              ></textarea>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Teléfono Auxiliar (Referencia)</label>
              {isGeneratingPdf ? <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{formData.telefonoReferencia || '-'}</div> :
              <input 
                type="text" name="telefonoReferencia" value={formData.telefonoReferencia} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
              />}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase">Forma de Pago</label>
              {isGeneratingPdf ? <div className="py-2 font-bold text-gray-900 border-b border-gray-200 min-h-[36px]">{formData.formaPago || '-'}</div> :
              <select 
                name="formaPago" value={formData.formaPago} onChange={handleInputChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:appearance-none print:border-none print:p-0 print:font-medium print:bg-transparent"
              >
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Contra Entrega">Contra Entrega</option>
                <option value="Tarjeta">Tarjeta / Link de Pago</option>
              </select>}
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
                        {isGeneratingPdf ? <div className="py-2 text-gray-900 border-b border-gray-100">{prod.codigo || '-'}</div> :
                        <input 
                          type="text" 
                          value={prod.codigo} 
                          onChange={(e) => handleProductChange(index, 'codigo', e.target.value)}
                          placeholder="Ej. 000123"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
                        />}
                      </td>
                      <td className="px-2 py-2 relative align-top">
                        {isGeneratingPdf ? <div className="py-2 text-gray-900 font-medium border-b border-gray-100">{prod.nombre || '-'}</div> :
                        <textarea 
                          rows="2"
                          value={prod.nombre} 
                          onChange={(e) => handleProductChange(index, 'nombre', e.target.value)}
                          onFocus={() => handleProductChange(index, 'showSearch', true)}
                          onBlur={() => setTimeout(() => handleProductChange(index, 'showSearch', false), 200)}
                          placeholder="Buscar producto..."
                          className="w-full p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium resize-none overflow-hidden text-sm leading-tight"
                        ></textarea>}
                        {!isGeneratingPdf && prod.showSearch && prod.nombre.length > 1 && (
                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-lg print:hidden">
                            {products
                              .filter(p => p.title.toLowerCase().includes(prod.nombre.toLowerCase()))
                              .slice(0, 10)
                              .map(p => (
                                <div 
                                  key={p.id}
                                  onMouseDown={() => handleSelectProduct(index, p)}
                                  className="p-2 hover:bg-brand-red hover:text-white cursor-pointer border-b border-gray-100 last:border-0 text-xs"
                                >
                                  {p.title} <span className="opacity-75 float-right">${p.price}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {isGeneratingPdf ? <div className="py-2 text-gray-900 font-bold border-b border-gray-100">{prod.cantidad || '1'}</div> :
                        <input 
                          type="number" 
                          min="1"
                          value={prod.cantidad} 
                          onChange={(e) => handleProductChange(index, 'cantidad', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-brand-red focus:border-brand-red print:border-none print:p-0 print:font-medium"
                        />}
                      </td>
                      {!isGeneratingPdf && (
                        <td className="px-2 py-2 text-center print:hidden">
                          <button 
                            onClick={() => removeProductRow(index)}
                            disabled={productos.length === 1}
                            className={`p-2 rounded text-white ${productos.length === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      )}
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
