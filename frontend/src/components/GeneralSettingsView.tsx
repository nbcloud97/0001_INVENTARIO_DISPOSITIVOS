import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Database,
  Shield,
  Layers,
  HardDrive,
  Users,
  Cpu,
  FileText,
  Paperclip,
  UserPlus,
  Edit2,
  Trash2,
  Key,
  X,
  UserCheck,
} from 'lucide-react';
import { api, UserProfile } from '../services/api';
import {
  UserItem,
  CreateUserData,
  AVAILABLE_PERMISSIONS,
  PermissionKey,
  hasPermission,
} from '../types';

interface GeneralSettingsViewProps {
  onRestoreSuccess: () => void;
  currentUser?: UserProfile | null;
}

export const GeneralSettingsView: React.FC<GeneralSettingsViewProps> = ({
  onRestoreSuccess,
  currentUser,
}) => {
  // Permisos del usuario actual
  const canManageUsers = hasPermission(currentUser, 'MANAGE_USERS');
  const canManageBackups = hasPermission(currentUser, 'MANAGE_BACKUPS');

  // Estadísticas de Base de Datos
  const [stats, setStats] = useState<{
    clients: number;
    systems: number;
    subsystems: number;
    deviceTypes: number;
    deviceStatuses: number;
    devices: number;
    systemNotes: number;
    systemAttachments: number;
  } | null>(null);

  const [loadingStats, setLoadingStats] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Gestión de Usuarios
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);
  const [userFormData, setUserFormData] = useState<CreateUserData>({
    username: '',
    name: '',
    password: '',
    role: 'ADMIN',
    permissions: AVAILABLE_PERMISSIONS.map((p) => p.key),
  });
  const [savingUser, setSavingUser] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  // Modal confirmación eliminar usuario
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.getBackupStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error al cargar estadísticas de la base de datos:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const handleDownloadBackup = async () => {
    if (!canManageBackups) {
      setErrorMessage('No tienes permiso para descargar copias de seguridad.');
      return;
    }
    setDownloading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await api.downloadBackup();
      setSuccessMessage('Copia de seguridad generada y descargada con éxito.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al descargar la copia de seguridad.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.json')) {
        setErrorMessage('Por favor, selecciona un archivo válido con extensión .json');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const handleExecuteRestore = async () => {
    if (!canManageBackups) {
      setErrorMessage('No tienes permiso para restaurar copias de seguridad.');
      return;
    }
    if (!selectedFile) return;
    setIsConfirmModalOpen(false);
    setRestoring(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await api.restoreBackup(selectedFile);
      setSuccessMessage(
        `Copia de seguridad restaurada correctamente: ${result.restored.clients} clientes, ${result.restored.systems} sistemas, ${result.restored.devices} dispositivos.`
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchStats();
      fetchUsers();
      onRestoreSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error durante la restauración del backup.');
    } finally {
      setRestoring(false);
    }
  };

  // Preset de permisos
  const applyPermissionPreset = (preset: 'ADMIN' | 'TECH' | 'VIEWER' | 'NONE') => {
    let perms: PermissionKey[] = [];
    let role = userFormData.role || 'USER';

    if (preset === 'ADMIN') {
      perms = AVAILABLE_PERMISSIONS.map((p) => p.key);
      role = 'ADMIN';
    } else if (preset === 'TECH') {
      perms = ['VIEW_INVENTORY', 'EDIT_INVENTORY', 'VIEW_PASSWORDS', 'BETA10_IMPORT'];
      role = 'USER';
    } else if (preset === 'VIEWER') {
      perms = ['VIEW_INVENTORY'];
      role = 'VIEWER';
    } else if (preset === 'NONE') {
      perms = [];
    }

    setUserFormData({
      ...userFormData,
      role,
      permissions: perms,
    });
  };

  const handleTogglePermission = (permKey: PermissionKey) => {
    const current = userFormData.permissions || [];
    const exists = current.includes(permKey);
    const updated = exists
      ? current.filter((k) => k !== permKey)
      : [...current, permKey];
    setUserFormData({
      ...userFormData,
      permissions: updated,
    });
  };

  // Abrir modal para crear usuario
  const handleOpenCreateUser = () => {
    setUserToEdit(null);
    setUserFormData({
      username: '',
      name: '',
      password: '',
      role: 'ADMIN',
      permissions: AVAILABLE_PERMISSIONS.map((p) => p.key),
    });
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  // Abrir modal para editar usuario
  const handleOpenEditUser = (u: UserItem) => {
    setUserToEdit(u);
    const userPerms =
      u.permissions && u.permissions.length > 0
        ? u.permissions
        : u.role === 'ADMIN'
        ? AVAILABLE_PERMISSIONS.map((p) => p.key)
        : ['VIEW_INVENTORY'];

    setUserFormData({
      username: u.username,
      name: u.name,
      password: '',
      role: u.role,
      permissions: userPerms,
    });
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  // Guardar usuario (Crear o Actualizar)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError(null);
    setSavingUser(true);

    try {
      if (userToEdit) {
        // Actualizar usuario
        const updatePayload: Partial<CreateUserData> = {
          name: userFormData.name,
          role: userFormData.role,
          permissions: userFormData.permissions || [],
        };
        if (userFormData.password && userFormData.password.trim()) {
          updatePayload.password = userFormData.password.trim();
        }
        await api.updateUser(userToEdit.id, updatePayload);
        setSuccessMessage(`Usuario "${userToEdit.username}" actualizado correctamente.`);
      } else {
        // Crear nuevo usuario
        if (!userFormData.password || userFormData.password.trim().length < 4) {
          throw new Error('La contraseña debe tener al menos 4 caracteres.');
        }
        await api.createUser({
          username: userFormData.username.trim().toUpperCase(),
          name: userFormData.name?.trim() || userFormData.username.trim().toUpperCase(),
          password: userFormData.password.trim(),
          role: userFormData.role || 'USER',
          permissions: userFormData.permissions || [],
        });
        setSuccessMessage(`Usuario "${userFormData.username.trim().toUpperCase()}" creado correctamente.`);
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setUserModalError(err.message || 'Error al guardar el usuario');
    } finally {
      setSavingUser(false);
    }
  };

  // Ejecutar eliminación de usuario
  const handleExecuteDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      await api.deleteUser(userToDelete.id);
      setSuccessMessage(`Usuario "${userToDelete.username}" eliminado correctamente.`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      alert(`Error al eliminar usuario: ${err.message}`);
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Encabezado */}
      <div>
        <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Database size={22} color="var(--accent-blue)" />
          Configuraci&oacute;n General, Usuarios y Copias de Seguridad
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Administra las cuentas de acceso al sistema y gestiona las copias de seguridad de la base de datos.
        </p>
      </div>

      {/* Alertas Globales */}
      {successMessage && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-emerald)',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--accent-rose)',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 1: GESTIÓN DE USUARIOS DE ACCESO                                 */}
      {/* ========================================================================= */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: 'var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Usuarios de Acceso</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Cuentas autorizadas y gestión granular de permisos en la aplicación
              </span>
            </div>
          </div>

          {canManageUsers && (
            <button className="btn btn-primary" onClick={handleOpenCreateUser}>
              <UserPlus size={16} /> Nuevo Usuario
            </button>
          )}
        </div>

        {/* Tabla de Usuarios */}
        <div className="table-card" style={{ border: 'none', background: 'transparent' }}>
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="spin-animate" />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Users className="empty-icon" size={32} />
              <h3>No hay usuarios registrados</h3>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="device-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Usuario (Login)</th>
                    <th>Nombre Completo</th>
                    <th>Rol</th>
                    <th>Permisos Asignados</th>
                    <th>Fecha de Alta</th>
                    {canManageUsers && <th style={{ textAlign: 'right' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const userPermsCount =
                      u.permissions && u.permissions.length > 0
                        ? u.permissions.length
                        : u.role === 'ADMIN'
                        ? AVAILABLE_PERMISSIONS.length
                        : 1;

                    return (
                      <tr key={u.id}>
                        <td>
                          <span
                            className="code-font"
                            style={{
                              fontWeight: 700,
                              color: 'var(--accent-purple)',
                              background: 'rgba(168, 85, 247, 0.12)',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(168, 85, 247, 0.25)',
                            }}
                          >
                            {u.username}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '0.15rem 0.55rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background:
                                u.role === 'ADMIN'
                                  ? 'rgba(234, 88, 12, 0.15)'
                                  : 'rgba(2, 132, 199, 0.15)',
                              color: u.role === 'ADMIN' ? '#ea580c' : 'var(--accent-cyan)',
                              border:
                                u.role === 'ADMIN'
                                  ? '1px solid rgba(234, 88, 12, 0.3)'
                                  : '1px solid rgba(2, 132, 199, 0.3)',
                            }}
                          >
                            {u.role === 'ADMIN' ? 'Administrador' : u.role === 'VIEWER' ? 'Solo Lectura' : 'Usuario Estándar'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              fontSize: '0.78rem',
                              padding: '0.15rem 0.6rem',
                              borderRadius: '4px',
                              background:
                                userPermsCount === AVAILABLE_PERMISSIONS.length
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : 'var(--bg-secondary)',
                              color:
                                userPermsCount === AVAILABLE_PERMISSIONS.length
                                  ? 'var(--accent-emerald)'
                                  : 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                            }}
                            title={u.permissions?.join(', ') || 'Permisos'}
                          >
                            <Shield size={13} />
                            {userPermsCount} de {AVAILABLE_PERMISSIONS.length} permisos
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </td>
                        {canManageUsers && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                className="btn btn-secondary btn-icon"
                                title="Editar usuario y permisos"
                                onClick={() => handleOpenEditUser(u)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="btn btn-danger btn-icon"
                                title="Eliminar usuario"
                                onClick={() => setUserToDelete(u)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: COPIAS DE SEGURIDAD (BACKUP & RESTORE)                         */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* TARJETA: Hacer Copia de Seguridad */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(0, 85, 150, 0.15)',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Exportar Copia de Seguridad</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Descarga un archivo JSON con todos los datos
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
              La copia de seguridad incluirá todos los clientes, sistemas, subsistemas, tipos de dispositivo, estados, dispositivos con sus credenciales cifradas, notas y adjuntos técnicos.
            </p>

            {/* Resumen del contenido actual a respaldar */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                margin: '1.25rem 0',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Resumen de datos en el sistema
              </div>

              {loadingStats ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={18} className="spin-animate" />
                </div>
              ) : stats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Users size={14} color="var(--accent-blue)" />
                    <span><strong>{stats.clients}</strong> Clientes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Cpu size={14} color="var(--accent-blue)" />
                    <span><strong>{stats.systems}</strong> Sistemas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <HardDrive size={14} color="var(--accent-purple)" />
                    <span><strong>{stats.devices}</strong> Dispositivos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Shield size={14} color="var(--accent-emerald)" />
                    <span><strong>{stats.subsystems}</strong> Subsistemas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FileText size={14} color="var(--accent-cyan)" />
                    <span><strong>{stats.systemNotes}</strong> Notas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Paperclip size={14} color="var(--accent-rose)" />
                    <span><strong>{stats.systemAttachments}</strong> Adjuntos</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadBackup}
            disabled={downloading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
          >
            {downloading ? (
              <>
                <RefreshCw size={16} className="spin-animate" /> Generando copia...
              </>
            ) : (
              <>
                <Download size={16} /> Descargar Copia de Seguridad (.json)
              </>
            )}
          </button>
        </div>

        {/* TARJETA: Restaurar Copia de Seguridad */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(234, 88, 12, 0.15)',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Restaurar Copia de Seguridad</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Carga un archivo de respaldo previo en formato JSON
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
              Restaura la información a partir de un archivo <code className="code-font">.json</code> generado previamente por este aplicativo.
            </p>

            {/* Aviso de Precaución */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                margin: '1.25rem 0',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'flex-start',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
              }}
            >
              <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <strong>Aviso de integridad:</strong> La restauración actualizará y recreará los registros contenidos en el archivo de copia. Asegúrate de seleccionar el archivo correcto antes de proceder.
              </div>
            </div>

            {/* Selector de Archivo */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Seleccionar archivo de copia (.json)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="form-input"
                onChange={handleFileChange}
                disabled={restoring}
                style={{ cursor: 'pointer' }}
              />
              {selectedFile && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.775rem', color: 'var(--accent-blue)' }}>
                  Archivo seleccionado: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={!selectedFile || restoring}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.7rem',
              borderColor: selectedFile ? '#ea580c' : undefined,
              color: selectedFile ? '#ea580c' : undefined,
              fontWeight: 600,
            }}
          >
            {restoring ? (
              <>
                <RefreshCw size={16} className="spin-animate" /> Restaurando datos...
              </>
            ) : (
              <>
                <Upload size={16} /> Restaurar Copia de Seguridad
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR USUARIO                                            */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsUserModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Key color="var(--accent-purple)" size={22} />
                <h2>{userToEdit ? `Editar Usuario: ${userToEdit.username}` : 'Crear Nuevo Usuario'}</h2>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsUserModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="modal-body" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
                {userModalError && (
                  <div
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: 'var(--accent-rose)',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {userModalError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {/* Usuario (Login) */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Nombre de Usuario (Login) *</label>
                    <input
                      type="text"
                      className="form-input code-font"
                      placeholder="Ej: JPEREZ"
                      value={userFormData.username}
                      onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value.toUpperCase() })}
                      required
                      disabled={!!userToEdit}
                    />
                    {userToEdit && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        El identificador de login no se puede cambiar.
                      </span>
                    )}
                  </div>

                  {/* Nombre Completo */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Juan Pérez"
                      value={userFormData.name || ''}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">
                    {userToEdit ? 'Nueva Contraseña (dejar en blanco para conservar)' : 'Contraseña de Acceso *'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={userToEdit ? '•••••••• (sin cambios)' : 'Introduce una contraseña segura (mín. 4 caracteres)'}
                    value={userFormData.password || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required={!userToEdit}
                    minLength={4}
                  />
                </div>

                {/* SECCIÓN DE PERMISOS GRANULARES */}
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <label className="form-label" style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Shield size={16} color="var(--accent-purple)" />
                        Permisos Granulares
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Selecciona individualmente las acciones permitidas para este usuario
                      </span>
                    </div>

                    {/* Presets rápidos */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => applyPermissionPreset('ADMIN')}
                        title="Marcar todos los permisos"
                      >
                        Total (Admin)
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => applyPermissionPreset('TECH')}
                        title="Inventario, Contraseñas e Importación Beta 10"
                      >
                        Técnico
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => applyPermissionPreset('VIEWER')}
                        title="Solo consulta"
                      >
                        Solo Consulta
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => applyPermissionPreset('NONE')}
                        title="Desmarcar todos"
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>

                  {/* Grid de checkboxes de permisos */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '0.65rem',
                      background: 'var(--bg-secondary)',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {AVAILABLE_PERMISSIONS.map((p) => {
                      const isChecked = (userFormData.permissions || []).includes(p.key);
                      return (
                        <label
                          key={p.key}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '6px',
                            background: isChecked ? 'rgba(168, 85, 247, 0.08)' : 'var(--bg-card)',
                            border: `1px solid ${isChecked ? 'rgba(168, 85, 247, 0.35)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p.key)}
                            style={{ marginTop: '0.2rem', cursor: 'pointer', accentColor: 'var(--accent-purple)' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {p.label}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '0.1rem' }}>
                              {p.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsUserModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingUser}
                >
                  {savingUser ? 'Guardando...' : userToEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE USUARIO                                  */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="modal-backdrop" onClick={() => setUserToDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle color="var(--accent-rose)" size={22} />
                <h2>Eliminar Usuario</h2>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete.username}</strong> ({userToDelete.name})?
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Esta acción revocará inmediatamente su acceso a la plataforma.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setUserToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleExecuteDeleteUser}
                disabled={deletingUser}
              >
                {deletingUser ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMACIÓN DE RESTAURACIÓN DE BASE DE DATOS                      */}
      {/* ========================================================================= */}
      {isConfirmModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsConfirmModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle color="#ea580c" size={22} />
                <h2>¿Confirmar Restauración?</h2>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                Estás a punto de restaurar la base de datos a partir del archivo:
              </p>
              <div
                className="code-font"
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '0.65rem 1rem',
                  borderRadius: '6px',
                  margin: '0.75rem 0',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-blue)',
                }}
              >
                {selectedFile?.name}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Se sincronizarán e importarán todos los registros (clientes, sistemas, dispositivos y catálogos). ¿Deseas continuar?
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', borderColor: '#ea580c' }}
                onClick={handleExecuteRestore}
              >
                Sí, Restaurar Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
