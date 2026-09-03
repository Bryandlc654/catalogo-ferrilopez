import React from 'react';

const PrintableTicket = ({ ticket }) => {
  if (!ticket) return null;

  const { ticket_code, client_name, client_id, phone, city, address, delivery_reference, reference_phone, payment_method, created_at, products } = ticket;
  let prods = [];
  try {
    prods = typeof products === 'string' ? JSON.parse(products) : products;
  } catch(e) {}

  return (
    <div id="hidden-ticket-template" className="bg-white p-10 w-[800px] text-black print:block font-sans border-2 border-gray-100 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-8 border-b-4 border-brand-blue pb-6">
        <div className="flex items-center gap-4">
          <img src="/logoferri.png" alt="Logo Ferrilopez" className="h-16 object-contain" />
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-gray-900 tracking-wide uppercase">Orden de Despacho</h2>
          <div className="flex flex-col items-end gap-1 mt-2">
            <span className="bg-blue-50 text-brand-blue px-4 py-1.5 rounded-md font-bold border border-blue-100 text-lg">
              {ticket_code}
            </span>
            <p className="text-sm text-gray-500 font-medium mt-1">Fecha: {new Date(created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-brand-blue bg-blue-50 px-3 py-2 rounded-t-md border-b-2 border-brand-blue mb-4 uppercase text-sm">Datos del Cliente</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nombres y Apellidos</label>
            <div className="pt-1 pb-2 font-semibold text-gray-900 border-b border-gray-100 min-h-[36px]">{client_name || '-'}</div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cédula / RUC</label>
            <div className="pt-1 pb-2 font-semibold text-gray-900 border-b border-gray-100 min-h-[36px]">{client_id || '-'}</div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Teléfono Principal</label>
            <div className="pt-1 pb-2 font-semibold text-gray-900 border-b border-gray-100 min-h-[36px]">{phone || '-'}</div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ciudad</label>
            <div className="pt-1 pb-2 font-semibold text-gray-900 border-b border-gray-100 min-h-[36px]">{city || '-'}</div>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dirección Exacta</label>
            <div className="pt-1 pb-2 font-semibold text-gray-900 border-b border-gray-100 min-h-[36px]">{address || '-'}</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-brand-blue bg-blue-50 px-3 py-2 rounded-t-md border-b-2 border-brand-blue mb-4 uppercase text-sm">Logística y Entrega</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Referencias para llegar</label>
            <div className="pt-1 pb-2 font-semibold text-gray-900 border-b border-gray-100 min-h-[36px]">{delivery_reference || '-'}</div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Teléfono Auxiliar (Referencia)</label>
            <div className="pt-1 pb-2 font-semibold text-gray-900 border-b border-gray-100 min-h-[36px]">{reference_phone || '-'}</div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Forma de Pago</label>
            <div className="pt-1 pb-2 font-bold text-brand-blue border-b border-gray-100 min-h-[36px]">{payment_method || '-'}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-brand-blue bg-blue-50 px-3 py-2 rounded-t-md border-b-2 border-brand-blue mb-4 uppercase text-sm">Productos Solicitados</h3>
        <div className="px-3">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 w-16 font-bold">Img</th>
                <th className="px-4 py-3 w-1/4 font-bold">Código</th>
                <th className="px-4 py-3 w-1/2 font-bold">Descripción del Producto</th>
                <th className="px-4 py-3 w-1/4 font-bold text-center">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prods.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    {p.imageUrl ? (
                      <img 
                        src={p.imageUrl.startsWith('http') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/proxy-image?url=${encodeURIComponent(p.imageUrl)}` : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${p.imageUrl}`} 
                        alt={p.nombre} 
                        crossOrigin="anonymous"
                        className="w-10 h-10 object-contain" 
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 border border-gray-100 rounded">N/A</div>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className="text-gray-700 font-medium">{p.codigo || '-'}</span></td>
                  <td className="px-4 py-3"><span className="text-gray-900 font-semibold">{p.nombre || '-'}</span></td>
                  <td className="px-4 py-3 text-center"><span className="inline-block bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-800">{p.cantidad || '1'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintableTicket;
