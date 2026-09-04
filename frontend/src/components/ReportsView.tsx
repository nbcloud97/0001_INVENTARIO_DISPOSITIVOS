import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  Cpu,
  HardDrive,
  Shield,
  Lock,
  Layers,
  FileSpreadsheet,
  Building2,
  Tag,
  Camera,
  Network,
  PhoneCall,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { Client, System, Subsystem, Device, DeviceType } from '../types';
import { exportSystemDevicesToExcel } from '../utils/excelExport';

interface ReportsViewProps {
  clients: Client[];
  systems: System[];
  subsystems: Subsystem[];
  devices: Device[];
  deviceTypes: DeviceType[];
  onNavigateToClient: (clientId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  clients,
  systems,
  subsystems,
  devices,
  deviceTypes,
  onNavigateToClient,
}) => {
  const [selectedSubsystemFilter, setSelectedSubsystemFilter] = useState<string>('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('');

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

  // 3. Devices by Brand
  const brandCounts: Record<string, number> = {};
  devices.forEach(d => {
    const brandName = d.brand?.trim() || 'GENÉRICO / SIN MARCA';
    brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
  });
  const sortedBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Top 8 brands

  // Filtered devices for detailed report table
  const filteredDevices = devices.filter(d => {
    if (selectedSubsystemFilter && d.subsystemId !== selectedSubsystemFilter) return false;
    if (selectedClientFilter && d.clientId !== selectedClientFilter) return false;
    return true;
  });

  const getSubsystemIcon = (iconName?: string) => {
    switch (iconName) {
      case 'camera': return <Camera size={14} />;
      case 'network': return <Network size={14} />;
      case 'phone-call': return <PhoneCall size={14} />;
      case 'key-round': return <KeyRound size={14} />;
      default: return <Shield size={14} />;
    }
  };

  // Export full inventory report to CSV/Excel
  const handleExportFullReport = () => {
    exportSystemDevicesToExcel('INFORME GENERAL', 'TODOS LOS CLIENTES', filteredDevices);
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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Informes y Estad&iacute;sticas de Inventario
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Resumen ejecutivo del parque de dispositivos, desglose por subsistemas y auditor&iacute;a de clientes.
            </p>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={handleExportFullReport}>
          <FileSpreadsheet size={16} color="var(--accent-emerald)" /> Exportar Informe Completo
        </button>
      </div>

      {/* KPI Cards Grid */}
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
              Clientes
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

      {/* Grid Central: Desglose por Subsistema & Desglose por Marcas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
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

      {/* Tabla Resumen de Cobertura por Cliente */}
      <div className="table-card">
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Building2 size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Informe de Cobertura por Cliente
            </h3>
          </div>

          {/* Filtros rápidos */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: '180px', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              value={selectedSubsystemFilter}
              onChange={(e) => setSelectedSubsystemFilter(e.target.value)}
            >
              <option value="">Todos los subsistemas</option>
              {subsystems.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: '180px', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
            >
              <option value="">Todos los clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="device-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>NIF / ID Manual</th>
                <th>Sistemas Registrados</th>
                <th>Dispositivos</th>
                <th>Dispositivos por Subsistema</th>
                <th style={{ textAlign: 'right' }}>Acci&oacute;n</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => {
                const clientSystems = systems.filter(s => s.clientId === client.id);
                const clientDevices = devices.filter(d => d.clientId === client.id);

                return (
                  <tr key={client.id}>
                    {/* Cliente */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.925rem' }}>
                        {client.name}
                      </div>
                      {client.legalName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {client.legalName}
                        </div>
                      )}
                    </td>

                    {/* NIF / ID Manual */}
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>
                        {client.manualId && <div>ID: <span className="code-font">{client.manualId}</span></div>}
                        {client.cif && <div style={{ color: 'var(--text-secondary)' }}>NIF: <span className="code-font">{client.cif}</span></div>}
                        {!client.manualId && !client.cif && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </div>
                    </td>

                    {/* Sistemas Registrados */}
                    <td>
                      <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-blue)', fontWeight: 700 }}>
                        {clientSystems.length} {clientSystems.length === 1 ? 'sistema' : 'sistemas'}
                      </span>
                    </td>

                    {/* Total Dispositivos */}
                    <td>
                      <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)', fontWeight: 700 }}>
                        {clientDevices.length} equipos
                      </span>
                    </td>

                    {/* Dispositivos por Subsistema */}
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {subsystems.map(sub => {
                          const subCount = clientDevices.filter(d => d.subsystemId === sub.id).length;
                          if (subCount === 0) return null;
                          return (
                            <span
                              key={sub.id}
                              style={{
                                fontSize: '0.725rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: `${sub.color}20`,
                                color: sub.color,
                                border: `1px solid ${sub.color}44`,
                                fontWeight: 600,
                              }}
                            >
                              {sub.name}: {subCount}
                            </span>
                          );
                        })}
                        {clientDevices.length === 0 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin equipos</span>
                        )}
                      </div>
                    </td>

                    {/* Acción Ir al Cliente */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
                        title="Ver en pestaña Clientes"
                        onClick={() => onNavigateToClient(client.id)}
                      >
                        <ExternalLink size={14} /> Abrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
