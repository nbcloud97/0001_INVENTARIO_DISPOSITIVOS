import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ClientTable } from './components/ClientTable';
import { ClientModal } from './components/ClientModal';
import { SystemTable } from './components/SystemTable';
import { SystemModal } from './components/SystemModal';
import { SubsystemTable } from './components/SubsystemTable';
import { SubsystemModal } from './components/SubsystemModal';
import { DeviceTypeTable } from './components/DeviceTypeTable';
import { DeviceTypeModal } from './components/DeviceTypeModal';
import { DeviceStatusTable } from './components/DeviceStatusTable';
import { DeviceStatusModal } from './components/DeviceStatusModal';
import { DeviceTable } from './components/DeviceTable';
import { DeviceModal } from './components/DeviceModal';
import { BulkDeviceModal } from './components/BulkDeviceModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { DeviceDetailsModal } from './components/DeviceDetailsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginView } from './components/LoginView';
import { SystemNotesView } from './components/SystemNotesView';
import { SystemAttachmentsView } from './components/SystemAttachmentsView';
import { ReportsView } from './components/ReportsView';

import { Client, Subsystem, System, Device, DeviceType, DeviceStatus } from './types';
import { api, UserProfile } from './services/api';
import { exportSystemDevicesToExcel } from './utils/excelExport';
import { ArrowLeft, Building2, Cpu, Layers3, FileSpreadsheet, ChevronDown, Upload, HardDrive, FileText, Paperclip, Edit2, Shield, Tag } from 'lucide-react';

export const App: React.FC = () => {
  // Autenticación State
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authChecking, setAuthChecking] = useState(true);

  // Verificar validez del Token JWT al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.getMe()
        .then((u) => {
          setUser(u);
          localStorage.setItem('auth_user', JSON.stringify(u));
        })
        .catch(() => {
          api.logout();
          setUser(null);
        })
        .finally(() => setAuthChecking(false));
    } else {
      setAuthChecking(false);
    }
  }, []);

  // Navigation: Main tabs ('clients' | 'reports' | 'config')
  const [activeTab, setActiveTab] = useState<'clients' | 'reports' | 'config'>('clients');

  // Sub-pestañas en Configuración ('subsystems' | 'deviceTypes' | 'statuses')
  const [configTab, setConfigTab] = useState<'subsystems' | 'deviceTypes' | 'statuses'>('subsystems');

  // Sub-tabs dentro de un Sistema ('devices' | 'notes' | 'attachments')
  const [systemTab, setSystemTab] = useState<'devices' | 'notes' | 'attachments'>('devices');

  // Theme state ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // State data
  const [clients, setClients] = useState<Client[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus[]>([]);

  // Selection hierarchy for Clientes tab: Client -> System -> Devices
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedSubsystemFilterId, setSelectedSubsystemFilterId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [systemToEdit, setSystemToEdit] = useState<System | null>(null);

  const [isSubsystemModalOpen, setIsSubsystemModalOpen] = useState(false);
  const [subsystemToEdit, setSubsystemToEdit] = useState<Subsystem | null>(null);

  const [isDeviceTypeModalOpen, setIsDeviceTypeModalOpen] = useState(false);
  const [deviceTypeToEdit, setDeviceTypeToEdit] = useState<DeviceType | null>(null);

  const [isDeviceStatusModalOpen, setIsDeviceStatusModalOpen] = useState(false);
  const [deviceStatusToEdit, setDeviceStatusToEdit] = useState<DeviceStatus | null>(null);

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<Device | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Dropdown Opciones State
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Device Details Modal State
  const [selectedDetailsDevice, setSelectedDetailsDevice] = useState<Device | null>(null);

  // Confirmation Warning Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'client' | 'system' | 'subsystem' | 'device' | 'deviceType' | 'deviceStatus' | null;
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    id: '',
    title: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Close options menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active objects
  const activeClient = clients.find((c) => c.id === selectedClientId) || null;
  const activeSystem = systems.find((s) => s.id === selectedSystemId) || null;

  // Load data
  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [cls, subs, sysList, devs, dTypes, dStatuses] = await Promise.all([
        api.getClients(),
        api.getSubsystems(),
        api.getSystems(selectedClientId || undefined),
        api.getDevices({
          systemId: selectedSystemId || undefined,
          clientId: selectedClientId || undefined,
          subsystemId: selectedSubsystemFilterId || undefined,
          search: searchTerm || undefined,
        }),
        api.getDeviceTypes(),
        api.getDeviceStatuses(),
      ]);
      setClients(cls);
      setSubsystems(subs);
      setSystems(sysList);
      setDevices(devs);
      setDeviceTypes(dTypes);
      setDeviceStatuses(dStatuses);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedClientId, selectedSystemId, selectedSubsystemFilterId, searchTerm]);

  // Request Confirmation Handlers
  const requestDeleteClient = (id: string) => {
    const target = clients.find(c => c.id === id);
    setConfirmModal({
      isOpen: true,
      type: 'client',
      id,
      title: 'Eliminar Cliente',
      message: `⚠️ ADVERTENCIA: Se eliminará el cliente "${target?.name || ''}" y TODOS sus sistemas y dispositivos asociados. Esta acción no se puede deshacer.`,
    });
  };

  const requestDeleteSystem = (id: string) => {
    const target = systems.find(s => s.id === id);
    setConfirmModal({
      isOpen: true,
      type: 'system',
      id,
      title: 'Eliminar Sistema',
      message: `⚠️ ADVERTENCIA: Se eliminará permanentemente el sistema "${target?.name || ''}" y TODOS los dispositivos pertenecientes a él.`,
    });
  };

  const requestDeleteSubsystem = (id: string) => {
    const target = subsystems.find(s => s.id === id);
    const countDevices = devices.filter(d => d.subsystemId === id).length;
    const countTypes = deviceTypes.filter(dt => dt.subsystemId === id).length;

    if (countDevices > 0 || countTypes > 0) {
      const details = [];
      if (countDevices > 0) details.push(`${countDevices} dispositivo(s)`);
      if (countTypes > 0) details.push(`${countTypes} tipo(s) de dispositivo`);

      alert(
        `⚠️ ADVERTENCIA: No se puede eliminar el subsistema "${target?.name || ''}" porque está en uso por ${details.join(' y ')}.\n\nPara poder eliminarlo, primero debes reasignar o eliminar los elementos vinculados.`
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'subsystem',
      id,
      title: 'Eliminar Subsistema',
      message: `¿Deseas eliminar el subsistema "${target?.name || ''}" de la configuración?`,
    });
  };

  const requestDeleteDevice = (id: string) => {
    const target = devices.find(d => d.id === id);
    setConfirmModal({
      isOpen: true,
      type: 'device',
      id,
      title: 'Eliminar Dispositivo',
      message: `¿Deseas eliminar el dispositivo "${target?.assignedName || ''}" del inventario?`,
    });
  };

  const requestDeleteDeviceType = (id: string) => {
    const target = deviceTypes.find(dt => dt.id === id);
    const countAssociated = devices.filter(d => d.deviceTypeId === id).length;

    if (countAssociated > 0) {
      alert(
        `⚠️ ADVERTENCIA: No se puede eliminar el tipo de dispositivo "${target?.name || ''}" porque está asociado a ${countAssociated} dispositivo(s) en el inventario.\n\nPara poder eliminar este tipo, primero debes reasignar o eliminar los dispositivos asociados.`
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'deviceType',
      id,
      title: 'Eliminar Tipo de Dispositivo',
      message: `¿Deseas eliminar el tipo de dispositivo "${target?.name || ''}" del catálogo?`,
    });
  };

  const requestDeleteDeviceStatus = (id: string) => {
    const target = deviceStatuses.find(st => st.id === id);
    const countAssigned = devices.filter(d => d.statusId === id).length;

    if (countAssigned > 0) {
      alert(
        `⚠️ ADVERTENCIA: No se puede eliminar el estado "${target?.name || ''}" porque está asignado a ${countAssigned} dispositivo(s) en el inventario.\n\nPara poder eliminar este estado, primero debes reasignar o eliminar los dispositivos asociados.`
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'deviceStatus',
      id,
      title: 'Eliminar Estado de Dispositivo',
      message: `¿Deseas eliminar el estado "${target?.name || ''}" de la configuración?`,
    });
  };

  const handleSaveDeviceStatus = async (data: { name: string; color?: string; description?: string }) => {
    if (deviceStatusToEdit) {
      await api.updateDeviceStatus(deviceStatusToEdit.id, data);
    } else {
      await api.createDeviceStatus(data);
    }
    loadData();
  };

  // Execute Confirmed Delete
  const handleExecuteDelete = async () => {
    const { type, id } = confirmModal;
    if (!type || !id) return;

    setDeleting(true);
    try {
      if (type === 'client') {
        await api.deleteClient(id);
        if (selectedClientId === id) {
          setSelectedClientId('');
          setSelectedSystemId('');
        }
      } else if (type === 'system') {
        await api.deleteSystem(id);
        if (selectedSystemId === id) {
          setSelectedSystemId('');
        }
      } else if (type === 'subsystem') {
        await api.deleteSubsystem(id);
      } else if (type === 'device') {
        await api.deleteDevice(id);
      } else if (type === 'deviceType') {
        await api.deleteDeviceType(id);
      } else if (type === 'deviceStatus') {
        await api.deleteDeviceStatus(id);
      }
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      loadData();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditDevice = (device: Device) => {
    setDeviceToEdit(device);
    setIsDeviceModalOpen(true);
  };

  // Exportar Excel
  const handleExport = async () => {
    if (!activeSystem) return;
    setExporting(true);
    try {
      await exportSystemDevicesToExcel(
        activeSystem.name,
        activeClient?.name || '',
        devices
      );
    } catch (err: any) {
      alert(`Error al exportar a Excel: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  // Pantalla de carga mientras se verifica el token
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        Cargando inventario...
      </div>
    );
  }

  // Pantalla de Login si no hay usuario autenticado
  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="app-container">
      {/* Header & Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* ========================================================================= */}
        {/* PESTAÑA 1: CLIENTES (Jerarquía: Cliente -> Sistemas -> Dispositivos)     */}
        {/* ========================================================================= */}
        {activeTab === 'clients' && (
          <div>
            {/* NIVEL 3: Dispositivos y Notas de un Sistema específico */}
            {selectedClientId && selectedSystemId && activeSystem ? (
              <div>
                {/* Banner Breadcrumb Nivel 3 */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.85rem 1.25rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      title="Volver a la lista de sistemas del cliente"
                      onClick={() => {
                        setSelectedSystemId('');
                        setSystemTab('devices');
                      }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                          {activeClient?.manualId ? `(ID: ${activeClient.manualId}) ` : ''}{activeClient?.name} &gt;
                        </span>
                        <Cpu color="var(--accent-blue)" size={22} />
                        <h2 style={{ fontSize: '1.2rem' }}>{activeSystem.name}</h2>
                        {activeSystem.code && <span className="code-font" style={{ fontSize: '0.8rem' }}>{activeSystem.code}</span>}
                      </div>
                    </div>
                  </div>

                  {systemTab === 'devices' && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Desplegable Opciones */}
                      <div ref={optionsMenuRef} style={{ position: 'relative' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                          title="Opciones adicionales del sistema"
                        >
                          Opciones <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOptionsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>

                        {isOptionsMenuOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '0.35rem',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              boxShadow: 'var(--shadow-md)',
                              zIndex: 50,
                              minWidth: '170px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '0.25rem 0',
                            }}
                          >
                            {/* Opción 1: Exportar */}
                            <button
                              className="btn"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                padding: '0.55rem 1rem',
                                width: '100%',
                                justifyContent: 'flex-start',
                                borderRadius: 0,
                                fontSize: '0.825rem',
                              }}
                              onClick={() => {
                                setIsOptionsMenuOpen(false);
                                handleExport();
                              }}
                              disabled={exporting}
                            >
                              <FileSpreadsheet size={15} color="var(--accent-emerald)" />
                              {exporting ? 'Exportando...' : 'Exportar'}
                            </button>

                            {/* Opción 2: Importación */}
                            <button
                              className="btn"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                padding: '0.55rem 1rem',
                                width: '100%',
                                justifyContent: 'flex-start',
                                borderRadius: 0,
                                fontSize: '0.825rem',
                              }}
                              onClick={() => {
                                setIsOptionsMenuOpen(false);
                                setIsImportModalOpen(true);
                              }}
                            >
                              <Upload size={15} color="var(--accent-cyan)" /> Importaci&oacute;n
                            </button>

                            {/* Opción 3: Alta masiva */}
                            <button
                              className="btn"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                padding: '0.55rem 1rem',
                                width: '100%',
                                justifyContent: 'flex-start',
                                borderRadius: 0,
                                fontSize: '0.825rem',
                              }}
                              onClick={() => {
                                setIsOptionsMenuOpen(false);
                                setIsBulkModalOpen(true);
                              }}
                            >
                              <Layers3 size={15} color="var(--accent-purple)" /> Alta masiva
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Botón Nuevo Dispositivo */}
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setDeviceToEdit(null);
                          setIsDeviceModalOpen(true);
                        }}
                      >
                        Nuevo
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-Pestañas / Solapas del Sistema (Dispositivos | Notas) */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <button
                    className={`btn ${systemTab === 'devices' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', width: '140px', justifyContent: 'center' }}
                    onClick={() => setSystemTab('devices')}
                  >
                    <HardDrive size={15} /> Dispositivos
                  </button>
                  <button
                    className={`btn ${systemTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', width: '140px', justifyContent: 'center' }}
                    onClick={() => setSystemTab('notes')}
                  >
                    <FileText size={15} /> Notas
                  </button>
                  <button
                    className={`btn ${systemTab === 'attachments' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', width: '140px', justifyContent: 'center' }}
                    onClick={() => setSystemTab('attachments')}
                  >
                    <Paperclip size={15} /> Adjuntos
                  </button>
                </div>

                {/* Contenido según la Solapa Seleccionada */}
                {systemTab === 'devices' ? (
                  <DeviceTable
                    devices={devices}
                    subsystems={subsystems}
                    deviceStatuses={deviceStatuses}
                    selectedSubsystemId={selectedSubsystemFilterId}
                    setSelectedSubsystemId={setSelectedSubsystemFilterId}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onEditDevice={handleEditDevice}
                    onDeleteDevice={requestDeleteDevice}
                    onSelectDeviceDetails={(dev) => setSelectedDetailsDevice(dev)}
                  />
                ) : systemTab === 'notes' ? (
                  <SystemNotesView
                    systemId={selectedSystemId}
                    systemName={activeSystem.name}
                  />
                ) : (
                  <SystemAttachmentsView
                    systemId={selectedSystemId}
                    systemName={activeSystem.name}
                  />
                )}
              </div>
            ) : selectedClientId && activeClient ? (
              /* NIVEL 2: Sistemas del Cliente seleccionado */
              <div>
                {/* Banner Limpio Nivel 2 */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.85rem 1.25rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <button
                    className="btn btn-secondary btn-icon"
                    title="Volver a la lista general de clientes"
                    onClick={() => setSelectedClientId('')}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, flexWrap: 'wrap' }}>
                    <Building2 color="var(--accent-blue)" size={22} />
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {activeClient.manualId ? (
                        <span
                          className="code-font"
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--accent-purple)',
                            fontWeight: 600,
                            background: 'rgba(168, 85, 247, 0.15)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                          }}
                        >
                          ID: {activeClient.manualId}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          (Sin ID Manual)
                        </span>
                      )}
                      <span>{activeClient.name}</span>
                    </h2>
                  </div>
                </div>

                {/* Tabla de Sistemas de este Cliente */}
                <SystemTable
                  systems={systems.filter((s) => s.clientId === selectedClientId)}
                  onEditSystem={(sys) => {
                    setSystemToEdit(sys);
                    setIsSystemModalOpen(true);
                  }}
                  onDeleteSystem={requestDeleteSystem}
                  onSelectSystemDevices={(sysId) => {
                    setSelectedSystemId(sysId);
                    setSystemTab('devices');
                    setSelectedSubsystemFilterId('');
                    setSearchTerm('');
                  }}
                  onOpenNewSystem={() => {
                    setSystemToEdit(null);
                    setIsSystemModalOpen(true);
                  }}
                  showClientName={false}
                />
              </div>
            ) : (
              /* NIVEL 1: Lista General de Clientes */
              <div>
                <ClientTable
                  clients={clients}
                  onEditClient={(client) => {
                    setClientToEdit(client);
                    setIsClientModalOpen(true);
                  }}
                  onDeleteClient={requestDeleteClient}
                  onSelectClientSystems={(clientId) => {
                    setSelectedClientId(clientId);
                    setSelectedSystemId('');
                    setSystemTab('devices');
                    setSelectedSubsystemFilterId('');
                    setSearchTerm('');
                  }}
                  onOpenNewClient={() => {
                    setClientToEdit(null);
                    setIsClientModalOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        )}
        {/* ========================================================================= */}
        {/* PESTAÑA 2: INFORMES (Estadísticas y Resumen de Inventario)               */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <ReportsView
            clients={clients}
            systems={systems}
            subsystems={subsystems}
            devices={devices}
            deviceTypes={deviceTypes}
            deviceStatuses={deviceStatuses}
            onNavigateToClient={(clientId) => {
              setSelectedClientId(clientId);
              setSelectedSystemId('');
              setActiveTab('clients');
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: CONFIGURACIÓN (Subsistemas & Dispositivos)                    */}
        {/* ========================================================================= */}
        {activeTab === 'config' && (
          <div>
            {/* Sub-Pestañas de Configuración */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem',
              }}
            >
              <button
                className={`btn ${configTab === 'subsystems' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', width: '140px', justifyContent: 'center' }}
                onClick={() => setConfigTab('subsystems')}
              >
                <Shield size={15} /> Subsistemas
              </button>
              <button
                className={`btn ${configTab === 'deviceTypes' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', width: '140px', justifyContent: 'center' }}
                onClick={() => setConfigTab('deviceTypes')}
              >
                <HardDrive size={15} /> Dispositivos
              </button>
              <button
                className={`btn ${configTab === 'statuses' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', width: '140px', justifyContent: 'center' }}
                onClick={() => setConfigTab('statuses')}
              >
                <Tag size={15} /> Estados
              </button>
            </div>

            {configTab === 'subsystems' ? (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>Configuraci&oacute;n de Subsistemas</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                    Gestiona los subsistemas técnicos (CCTV, Intrusión, Control de Accesos, PCI, Redes, etc.)
                  </p>
                </div>

                <SubsystemTable
                  subsystems={subsystems}
                  onEditSubsystem={(sub) => {
                    setSubsystemToEdit(sub);
                    setIsSubsystemModalOpen(true);
                  }}
                  onDeleteSubsystem={requestDeleteSubsystem}
                  onOpenNewSubsystem={() => {
                    setSubsystemToEdit(null);
                    setIsSubsystemModalOpen(true);
                  }}
                />
              </div>
            ) : configTab === 'deviceTypes' ? (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>Cat&aacute;logo de Tipos de Dispositivo</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                    Crea y gestiona tipos de dispositivo asociados obligatoriamente a un subsistema (ej: C&aacute;mara de v&iacute;deo en CCTV).
                  </p>
                </div>

                <DeviceTypeTable
                  deviceTypes={deviceTypes}
                  subsystems={subsystems}
                  devices={devices}
                  onEditDeviceType={(dt) => {
                    setDeviceTypeToEdit(dt);
                    setIsDeviceTypeModalOpen(true);
                  }}
                  onDeleteDeviceType={requestDeleteDeviceType}
                  onOpenNewDeviceType={() => {
                    setDeviceTypeToEdit(null);
                    setIsDeviceTypeModalOpen(true);
                  }}
                  onSelectDeviceDetails={(dev) => setSelectedDetailsDevice(dev)}
                />
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>Estados de Dispositivo</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                    Define y gestiona los estados de los dispositivos (Operativo, Baja, Falta instalaci&oacute;n, etc.) con sus respectivos colores.
                  </p>
                </div>

                <DeviceStatusTable
                  statuses={deviceStatuses}
                  devices={devices}
                  onEditStatus={(st) => {
                    setDeviceStatusToEdit(st);
                    setIsDeviceStatusModalOpen(true);
                  }}
                  onDeleteStatus={requestDeleteDeviceStatus}
                  onOpenNewStatus={() => {
                    setDeviceStatusToEdit(null);
                    setIsDeviceStatusModalOpen(true);
                  }}
                  onSelectDeviceDetails={(dev) => setSelectedDetailsDevice(dev)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALES */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={loadData}
        clientToEdit={clientToEdit}
      />

      <SystemModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        onSuccess={loadData}
        systemToEdit={systemToEdit}
        clients={clients}
        defaultClientId={selectedClientId}
      />

      <SubsystemModal
        isOpen={isSubsystemModalOpen}
        onClose={() => setIsSubsystemModalOpen(false)}
        onSuccess={loadData}
        subsystemToEdit={subsystemToEdit}
      />

      <DeviceTypeModal
        isOpen={isDeviceTypeModalOpen}
        onClose={() => setIsDeviceTypeModalOpen(false)}
        onSuccess={loadData}
        deviceTypeToEdit={deviceTypeToEdit}
        subsystems={subsystems}
      />

      <DeviceStatusModal
        isOpen={isDeviceStatusModalOpen}
        onClose={() => setIsDeviceStatusModalOpen(false)}
        onSave={handleSaveDeviceStatus}
        statusToEdit={deviceStatusToEdit}
      />

      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onSuccess={loadData}
        deviceToEdit={deviceToEdit}
        clients={clients}
        subsystems={subsystems}
        systems={systems}
        deviceStatuses={deviceStatuses}
        defaultSystemId={selectedSystemId}
      />

      <BulkDeviceModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadData}
        clients={clients}
        subsystems={subsystems}
        systems={systems}
        defaultSystemId={selectedSystemId}
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadData}
        systemId={selectedSystemId}
        systemName={activeSystem?.name}
      />

      <DeviceDetailsModal
        isOpen={!!selectedDetailsDevice}
        onClose={() => setSelectedDetailsDevice(null)}
        device={selectedDetailsDevice}
        onEditDevice={(dev) => {
          setSelectedDetailsDevice(null);
          handleEditDevice(dev);
        }}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        loading={deleting}
        onConfirm={handleExecuteDelete}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};