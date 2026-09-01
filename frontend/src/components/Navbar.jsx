import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiBookOpen, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';

const Navbar = () => {
  const { isAuthenticated, username, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <Link to="/" className="flex items-center group">
          <img 
            src="/logoferri.png" 
            alt="Logo" 
            className="h-12 sm:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-gray-600 hover:text-brand-red font-bold text-sm transition-colors flex items-center print:hidden bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                <FiSettings className="mr-1.5 text-lg"/> Panel Admin
              </Link>
              <span className="text-gray-600 font-medium flex items-center hidden sm:flex text-sm">
                <FiUser className="mr-2 text-brand-blue" />
                <span>Hola, <span className="font-bold text-brand-blue">{username}</span></span>
              </span>
              <button 
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-500 hover:text-brand-red py-2 px-3 rounded-lg transition-colors font-bold"
              >
                <FiLogOut className="mr-1.5 text-lg"/> Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">
                Ingresar
              </Link>
              <Link to="/register" className="bg-brand-blue hover:bg-blue-900 text-white py-2 px-5 rounded-full font-bold text-sm shadow-md shadow-blue-900/20 transition-all hover:-translate-y-0.5">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
