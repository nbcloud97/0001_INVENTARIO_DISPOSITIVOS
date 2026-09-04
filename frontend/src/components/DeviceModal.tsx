import React, { useState, useEffect } from 'react';
import { X, HardDrive, Lock, Plus, Trash2 } from 'lucide-react';
import { Client, Subsystem, System, Device, CreateDeviceFormData, DeviceCredentialItem, DeviceType } from '../types';
import { api } from '../services/api';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deviceToEdit?: Device | null;
  clients: Client[];
  subsystems: Subsystem[];
  systems: System[];
  defaultSystemId?: string;
}

export const DeviceModal: React.FC<DeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  deviceToEdit,
  clients,
  subsystems,
  systems,
  defaultSystemId,
}) => {
  const [formData, setFormData] = useState<CreateDeviceFormData>({
    systemId: defaultSystemId || (systems[0]?.id || ''),
    clientId: clients[0]?.id || '',
    subsystemId: subsystems[0]?.id || '',
    brand: '',
    model: '',
    serialNumber: '',
    assignedName: '',
    ipAddress: '',
    macAddress: '',
    credentials: [{ title: '', username: '', password: '' }],
    rackCabinet: '',
    switchName: '',
    switchPort: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<DeviceType[]>([]);

  useEffect(() => {
    if (formData.subsystemId) {
      api.getDeviceTypes(formData.subsystemId).then(setAvailableTypes).catch(console.error);
    } else {
      setAvailableTypes([]);
    }
  }, [formData.subsystemId]);

  useEffect(() => {
    if (deviceToEdit) {
      setFormData({
        systemId: deviceToEdit.systemId,
        clientId: deviceToEdit.clientId,
        subsystemId: deviceToEdit.subsystemId,
        deviceTypeId: deviceToEdit.deviceTypeId || '',
        brand: deviceToEdit.brand || '',
        model: deviceToEdit.model || '',
        serialNumber: deviceToEdit.serialNumber || '',
        assignedName: deviceToEdit.assignedName,
        ipAddress: deviceToEdit.ipAddress || '',
        macAddress: deviceToEdit.macAddress || '',
        credentials: [{ title: '', username: '', password: '' }],
        rackCabinet: deviceToEdit.rackCabinet || '',
        switchName: deviceToEdit.switchName || '',
        switchPort: deviceToEdit.switchPort || '',
        notes: deviceToEdit.notes || '',
      });

      if (deviceToEdit.hasCredentials) {
        api.getDeviceCredentials(deviceToEdit.id).then((creds) => {
          if (Array.isArray(creds) && creds.length > 0) {
            setFormData((prev) => ({
              ...prev,
              credentials: creds,
            }));
          }
        }).catch(console.error);
      }
    } else {
      const activeSys = systems.find(s => s.id === defaultSystemId) || systems[0];
      setFormData({
        systemId: defaultSystemId || (systems[0]?.id || ''),
        clientId: activeSys?.clientId || (clients[0]?.id || ''),
        subsystemId: activeSys?.subsystemId || (subsystems[0]?.id || ''),
        deviceTypeId: '',
        brand: '',
        model: '',
        serialNumber: '',
        assignedName: '',
        ipAddress: '',
        macAddress: '',
        credentials: [{ title: '', username: '', password: '' }],
        rackCabinet: '',
        switchName: '',
        switchPort: '',
        notes: '',
      });
    }
    setError(null);
  }, [deviceToEdit, isOpen, defaultSystemId, clients, subsystems, systems]);

  if (!isOpen) return null;

  // Credential Handlers
  const handleAddCredentialRow = () => {
    setFormData((prev) => ({
      ...prev,
      credentials: [
        ...(prev.credentials || []),
        { title: '', username: '', password: '' },
      ],
    }));
  };

  const handleRemoveCredentialRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      credentials: prev.credentials?.filter((_, i) => i !== index),
    }));
  };

  const handleCredentialChange = (index: number, field: keyof DeviceCredentialItem, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.credentials || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, credentials: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // MANTENER MAYÚSCULAS/MINÚSCULAS EXACTAS EN USUARIO Y CONTRASEÑA
    const upperFormData: CreateDeviceFormData = {
      ...formData,
      assignedName: formData.assignedName.toUpperCase().trim(),
      brand: formData.brand ? formData.brand.toUpperCase().trim() : '',
      model: formData.model ? formData.model.toUpperCase().trim() : '',
      serialNumber: formData.serialNumber ? formData.serialNumber.toUpperCase().trim() : '',
      ipAddress: formData.ipAddress ? formData.ipAddress.toUpperCase().trim() : '',
      macAddress: formData.macAddress ? formData.macAddress.toUpperCase().trim() : '',
      rackCabinet: formData.rackCabinet ? formData.rackCabinet.toUpperCase().trim() : '',
      switchName: formData.switchName ? formData.switchName.toUpperCase().trim() : '',
      switchPort: formData.switchPort ? formData.switchPort.toUpperCase().trim() : '',
      notes: formData.notes ? formData.notes.toUpperCase().trim() : '',
      credentials: formData.credentials
        ?.filter((c) => c.username || c.password || c.title)
        .map((c) => ({
          title: c.title ? c.title.toUpperCase().trim() : '',
          username: c.username ? c.username.trim() : '', // Preservar casing exacto
          password: c.password ? c.password.trim() : '', // Preservar casing exacto
        })),
    };

    try {
      if (deviceToEdit) {
        await api.updateDevice(deviceToEdit.id, upperFormData);
      } else {
        await api.createDevice(upperFormData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HardDrive color="var(--accent-blue)" size={22} />
            <h2>{deviceToEdit ? 'Editar Dispositivo' : 'Registrar Nuevo Dispositivo'}</h2>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-rose)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className="form-grid">
              {/* Subsistema Obligatorio */}
              <div className="form-group">
                <label className="form-label">Subsistema *</label>
                <select
                  className="form-select"
                  value={formData.subsystemId}
                  onChange={(e) => {
                    const newSubsystemId = e.target.value;
                    setFormData({
                      ...formData,
                      subsystemId: newSubsystemId,
                      deviceTypeId: '', // Reset tipo de dispositivo al cambiar subsistema
                    });
                  }}
                  required
                >
                  <option value="">-- Seleccionar Subsistema --</option>
                  {subsystems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Dispositivo (en base al Subsistema seleccionado) */}
              <div className="form-group">
                <label className="form-label">Tipo de Dispositivo</label>
                <select
                  className="form-select"
                  value={formData.deviceTypeId || ''}
                  onChange={(e) => {
                    const selectedTypeId = e.target.value;
                    const selectedType = availableTypes.find((t) => t.id === selectedTypeId);
                    setFormData((prev) => ({
                      ...prev,
                      deviceTypeId: selectedTypeId,
                      assignedName: !prev.assignedName && selectedType ? selectedType.name : prev.assignedName,
                    }));
                  }}
                  disabled={!formData.subsystemId || availableTypes.length === 0}
                >
                  <option value="">
                    {!formData.subsystemId
                      ? '-- Selecciona primero un Subsistema --'
                      : availableTypes.length === 0
                      ? 'Sin tipos definidos para este subsistema'
                      : '-- Seleccionar Tipo de Dispositivo --'}
                  </option>
                  {availableTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre Asignado Obligatorio */}
              <div className="form-group">
                <label className="form-label">Nombre Asignado *</label>
                <input
                  type="text"
                  className="form-input"
                  list="device-types-list"
                  value={formData.assignedName}
                  onChange={(e) => setFormData({ ...formData, assignedName: e.target.value })}
                  required
                />
                {availableTypes.length > 0 && (
                  <datalist id="device-types-list">
                    {availableTypes.map((dt) => (
                      <option key={dt.id} value={dt.name} />
                    ))}
                  </datalist>
                )}
              </div>

              {/* Marca */}
              <div className="form-group">
                <label className="form-label">Marca</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              {/* Modelo */}
              <div className="form-group">
                <label className="form-label">Modelo</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              {/* Nº Serie */}
              <div className="form-group">
                <label className="form-label">N&uacute;mero de Serie</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                />
              </div>

              {/* Direccion IP */}
              <div className="form-group">
                <label className="form-label">Direcci&oacute;n IP</label>
                <input
                  type="text"
                  className="form-input code-font"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                />
              </div>

              {/* Direccion MAC */}
              <div className="form-group">
                <label className="form-label">Direcci&oacute;n MAC</label>
                <input
                  type="text"
                  className="form-input code-font"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                />
              </div>

              {/* RACK */}
              <div className="form-group">
                <label className="form-label">RACK</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.rackCabinet}
                  onChange={(e) => setFormData({ ...formData, rackCabinet: e.target.value })}
                />
              </div>

              {/* REFERENCIA SWITCH */}
              <div className="form-group">
                <label className="form-label">REFERENCIA SWITCH</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.switchName}
                  onChange={(e) => setFormData({ ...formData, switchName: e.target.value })}
                />
              </div>

              {/* SWITCH PUERTO */}
              <div className="form-group">
                <label className="form-label">SWITCH PUERTO</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.switchPort}
                  onChange={(e) => setFormData({ ...formData, switchPort: e.target.value })}
                />
              </div>

              {/* Múltiples Credenciales */}
              <div className="form-group full-width" style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={16} color="var(--accent-amber)" />
                    <label className="form-label" style={{ color: 'var(--accent-amber)', margin: 0 }}>
                      Credenciales (Mantiene may&uacute;sculas y min&uacute;sculas exactas)
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={handleAddCredentialRow}
                  >
                    <Plus size={14} /> Añadir credencial
                  </button>
                </div>

                {formData.credentials && formData.credentials.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {formData.credentials.map((cred, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontWeight: 600, fontSize: '0.775rem', padding: '0.2rem 0.5rem', width: '220px' }}
                            placeholder="Etiqueta"
                            value={cred.title || ''}
                            onChange={(e) => handleCredentialChange(idx, 'title', e.target.value)}
                          />
                          {formData.credentials!.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-icon"
                              style={{ padding: '0.2rem 0.4rem' }}
                              title="Eliminar esta credencial"
                              onClick={() => handleRemoveCredentialRow(idx)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.725rem' }}>Usuario</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="admin (Sensible a mayúsculas/minúsculas)"
                              value={cred.username || ''}
                              onChange={(e) => handleCredentialChange(idx, 'username', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.725rem' }}>Contrase&ntilde;a</label>
                            <input
                              type="password"
                              className="form-input"
                              placeholder="•••••••• (Sensible a mayúsculas/minúsculas)"
                              value={cred.password || ''}
                              onChange={(e) => handleCredentialChange(idx, 'password', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No hay credenciales añadidas. Haz clic en "Añadir credencial".
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="form-group full-width">
                <label className="form-label">Notas / Observaciones</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : deviceToEdit ? 'Actualizar Dispositivo' : 'Guardar Dispositivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
