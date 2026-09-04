import React from 'react';
import { Server, Users, Settings, Sun, Moon, LogOut, User } from 'lucide-react';
import { UserProfile } from '../services/api';

interface HeaderProps {
  activeTab: 'clients' | 'config';
  setActiveTab: (tab: 'clients' | 'config') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  user,
  onLogout,
}) => {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo (Izquierda) */}
        <div className="logo-group">
          <div className="logo-icon">
            <Server size={20} />
          </div>
          <div>
            <div className="logo-title">Inventario</div>
            <div style={{ fontSize: '0.725rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Registro de Instalaciones, Sistemas &amp; Dispositivos
            </div>
          </div>
        </div>

        {/* Grupo de la Derecha: Pestañas + Info Usuario + Botón Logout + Botón Redondo de Tema */}
        <div className="header-right-group" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Navigation Tabs */}
          <div className="nav-tabs">
            <button
              className={`nav-btn ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('clients')}
            >
              <Users size={15} /> Clientes
            </button>
            <button
              className={`nav-btn ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              <Settings size={15} /> Configuración
            </button>
          </div>

          {/* User Profile Info & Logout */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ffffff', fontSize: '0.775rem', fontWeight: 600 }}>
                <User size={13} color="var(--accent-cyan)" />
                {user.name || user.username}
              </div>
              <button
                className="btn btn-secondary btn-icon"
                style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'transparent', color: '#ffffff' }}
                title="Cerrar Sesión"
                onClick={onLogout}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Botón Redondo Permutar Tema */}
          <button
            className="theme-toggle-btn-round"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Cambiar a Tema Oscuro' : 'Cambiar a Tema Claro'}
            aria-label="Permutar Tema"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
