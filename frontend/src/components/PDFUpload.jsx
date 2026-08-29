import React, { useState, useContext } from 'react';
import axios from 'axios';
import { FiUploadCloud, FiLoader } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const PDFUpload = ({ onProductsExtracted }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { token } = useContext(AuthContext);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Por favor selecciona un archivo PDF válido.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`\${import.meta.env.VITE_API_URL || '\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}'}/upload-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      
      // Ya no esperamos response.data.products, porque se hace en background
      if (response.data.backgroundProcess) {
         alert(response.data.message); // Notificamos al usuario
      } else if (response.data.products) {
         onProductsExtracted(response.data.products);
      }
      
      setFile(null);
    } catch (err) {
      console.error('Error subiendo PDF:', err);
      setError(err.response?.data?.detail || 'Error al extraer productos del PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-white p-8 rounded-2xl shadow-xl mb-12 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-brand-blue flex items-center">
        <FiUploadCloud className="mr-3 text-brand-red text-3xl" />
        Extraer Productos desde PDF
      </h2>
      <div className="flex flex-col items-center justify-center border-4 border-dashed border-blue-100 rounded-xl p-10 bg-gray-50 hover:bg-blue-50 transition-all duration-300 group">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
          <FiUploadCloud className="text-5xl text-brand-blue" />
        </div>
        <p className="text-brand-blue font-medium mb-6 text-center max-w-md">
          Arrastra y suelta tu catálogo PDF aquí, o haz clic para explorar tus archivos
        </p>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="bg-brand-yellow hover:bg-yellow-400 text-brand-blue font-bold py-3 px-8 rounded-lg cursor-pointer transition-all shadow-md transform hover:-translate-y-0.5"
        >
          Seleccionar Catálogo PDF
        </label>
        
        {file && (
          <div className="mt-6 px-4 py-2 bg-blue-100 text-brand-blue font-semibold rounded-lg text-sm border border-blue-200">
            Archivo listo: {file.name}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-brand-red rounded-lg border border-red-200 font-medium">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`flex items-center px-8 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
            !file || loading 
              ? 'bg-gray-300 cursor-not-allowed shadow-none' 
              : 'bg-brand-red hover:bg-red-700 transform hover:-translate-y-0.5'
          }`}
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin mr-3 text-xl" /> Extrayendo con IA...
            </>
          ) : (
            'Extraer Catálogo'
          )}
        </button>
      </div>
    </div>
  );
};

export default PDFUpload;
