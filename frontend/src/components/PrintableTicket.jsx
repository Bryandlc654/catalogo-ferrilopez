import React from 'react';

const PrintableTicket = ({ ticket }) => {
  if (!ticket) return null;

  const { ticket_code, client_name, client_id, phone, city, address, delivery_reference, reference_phone, payment_method, created_at, products } = ticket;
  let prods = [];
  try {
    prods = typeof products === 'string' ? JSON.parse(products) : products;
  } catch(e) {}

  return (
    <div id="hidden-ticket-template" className="bg-white p-8 w-[800px] text-black print:block">
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h2 className="text-3xl font-black text-gray-900 tracking-wider">FERRILOPEZ</h2>
        <p className="text-gray-600 font-medium">ORDEN DE DESPACHO Y ENTREGA</p>
        <div className="flex justify-center items-center gap-4 mt-2">
          <p className="text-sm text-gray-500 font-medium">Fecha: {new Date(created_at).toLocaleDateString()}</p>
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded font-bold border border-gray-300">
            {ticket_code}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-gray-800 border-b border-gray-300 mb-4 pb-1 uppercase text-sm">Datos del Cliente</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Nombres y Apellidos</label>
            <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{client_name || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Cédula / RUC</label>
            <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{client_id || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Teléfono Principal</label>
            <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{phone || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Ciudad</label>
            <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{city || '-'}</div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase">Dirección Exacta</label>
            <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{address || '-'}</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-gray-800 border-b border-gray-300 mb-4 pb-1 uppercase text-sm">Logística y Entrega</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase">Referencias para llegar</label>
            <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{delivery_reference || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Teléfono Auxiliar (Referencia)</label>
            <div className="py-2 font-medium text-gray-900 border-b border-gray-200 min-h-[36px]">{reference_phone || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Forma de Pago</label>
            <div className="py-2 font-bold text-gray-900 border-b border-gray-200 min-h-[36px]">{payment_method || '-'}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-800 uppercase text-sm border-b border-gray-300 mb-4 pb-1">Productos Solicitados</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 w-1/4">Código</th>
              <th className="px-4 py-2 w-1/2">Descripción del Producto</th>
              <th className="px-4 py-2 w-1/4">Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {prods.map((p, i) => (
              <tr key={i}>
                <td className="px-2 py-2"><div className="py-2 text-gray-900 border-b border-gray-100">{p.codigo || '-'}</div></td>
                <td className="px-2 py-2"><div className="py-2 text-gray-900 font-medium border-b border-gray-100">{p.nombre || '-'}</div></td>
                <td className="px-2 py-2"><div className="py-2 text-gray-900 font-bold border-b border-gray-100">{p.cantidad || '1'}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  );
};

export default PrintableTicket;
