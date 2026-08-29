import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiUserPlus, FiUser, FiLock } from 'react-icons/fi';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await axios.post(`\${import.meta.env.VITE_API_URL || '\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}'}/register`, { username, password });
      setSuccess('Usuario creado exitosamente. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full min-h-[70vh]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-brand-red">
        <div className="text-center mb-8">
          <div className="bg-red-50 inline-block p-4 rounded-full mb-4 shadow-sm text-brand-red">
            <FiUserPlus className="text-3xl" />
          </div>
          <h2 className="text-3xl font-extrabold text-brand-blue">Crear Cuenta</h2>
          <p className="text-gray-500 mt-2">Únete para administrar el catálogo</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-brand-red rounded-lg text-sm font-medium border border-red-100 text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Usuario</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                placeholder="Elige un usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                type="password"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                placeholder="Crea una contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all shadow-md transform hover:-translate-y-0.5 flex justify-center items-center"
          >
            {loading ? 'Registrando...' : <><FiUserPlus className="mr-2"/> Registrarme</>}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Ya tienes cuenta? <Link to="/login" className="text-brand-blue font-bold hover:underline">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
