import React from 'react';
import {
  BarChart3,
  Users,
  Cpu,
  HardDrive,
  Shield,
  Lock,
  Layers,
  Tag,
  Camera,
  Network,
  PhoneCall,
  KeyRound,
} from 'lucide-react';
import { Client, System, Subsystem, Device, DeviceType, DeviceStatus } from '../types';

interface ReportsViewProps {
  clients: Client[];
  systems: System[];
  subsystems: Subsystem[];
  devices: Device[];
  deviceTypes: DeviceType[];
  deviceStatuses?: DeviceStatus[];
  onNavigateToClient?: (clientId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  clients,
  systems,
  subsystems,
  devices,
  deviceTypes,
  deviceStatuses = [],
}) => {
  // 1. KPI Metrics
  const totalClients = clients.length;
  const totalSystems = systems.length;
  const totalDevices = devices.length;
  const totalDeviceTypes = deviceTypes.length;
  const devicesWithCreds = devices.filter(d => d.hasCredentials).length;

  // 2. Devices by Subsystem
  const subsystemStats = subsystems.map(sub => {
    const count = devices.filter(d => d.subsystemId === sub.id).length;
    const percentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
    return {
      ...sub,
      deviceCount: count,
      percentage,
    };
  }).sort((a, b) => b.deviceCount - a.deviceCount);

  // 3. Devices by Status
  const statusStats = deviceStatuses.map(st => {
    const count = devices.filter(d => d.statusId === st.id).length;
    const percentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
    return {
      ...st,
      deviceCount: count,
      percentage,
    };
  }).sort((a, b) => b.deviceCount - a.deviceCount);

  // 4. Devices by Brand
  const brandCounts: Record<string, number> = {};
  devices.forEach(d => {
    const brandName = d.brand?.trim() || 'GENÉRICO / SIN MARCA';
    brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
  });
  const sortedBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Top 8 brands

  const getSubsystemIcon = (iconName?: string) => {
    switch (iconName) {
      case 'camera': return <Camera size={14} />;
      case 'network': return <Network size={14} />;
      case 'phone-call': return <PhoneCall size={14} />;
      case 'key-round': return <KeyRound size={14} />;
      default: return <Shield size={14} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(2, 132, 199, 0.15)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <BarChart3 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>Informes y Resumen de Inventario</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Estad&iacute;sticas consolidadas del parque de dispositivos y clientes registrados.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Superior: KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* KPI 1: Clientes */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(2, 132, 199, 0.15)',
              color: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Clientes Activos
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {totalClients}
            </div>
          </div>
        </div>

        {/* KPI 2: Sistemas */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Sistemas
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {totalSystems}
            </div>
          </div>
        </div>

        {/* KPI 3: Dispositivos */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HardDrive size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Dispositivos
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {totalDevices}
            </div>
          </div>
        </div>

        {/* KPI 4: Tipos de Dispositivo */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Tag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Tipos Catalogados
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {totalDeviceTypes}
            </div>
          </div>
        </div>

        {/* KPI 5: Credenciales */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Equipos con Credenciales
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {devicesWithCreds}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Central: Subsistemas, Estados & Marcas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Desglose por Subsistema */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
            <Layers size={18} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Distribuci&oacute;n por Subsistemas
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {subsystemStats.map(sub => (
              <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                    <span style={{ color: sub.color }}>{getSubsystemIcon(sub.icon)}</span>
                    <span>{sub.name}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.825rem' }}>
                    {sub.deviceCount} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({sub.percentage}%)</span>
                  </div>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'var(--bg-primary)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${sub.percentage}%`,
                      background: sub.color || 'var(--accent-blue)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose por Estado de Dispositivo */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)' }}>
            <Tag size={18} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Distribuci&oacute;n por Estado
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {statusStats.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No hay estados registrados.
              </div>
            ) : (
              statusStats.map(st => (
                <div key={st.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: st.color || '#10b981',
                        }}
                      />
                      <span>{st.name}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.825rem' }}>
                      {st.deviceCount} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({st.percentage}%)</span>
                    </div>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${st.percentage}%`,
                        background: st.color || '#10b981',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Desglose por Marcas Principales */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)' }}>
            <Tag size={18} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Principales Marcas Registradas
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {sortedBrands.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No hay marcas registradas.
              </div>
            ) : (
              sortedBrands.map(([brand, count]) => {
                const brandPercentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
                return (
                  <div
                    key={brand}
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {brand}
                    </span>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                      {count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({brandPercentage}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
