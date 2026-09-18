import React, { useState, useEffect } from 'react';
import { X, Layers3, Zap, CheckCircle2, KeyRound, Plus, Trash2, Network } from 'lucide-react';
import { Client, Subsystem, System, BulkDeviceFormData, DeviceType, DeviceCredentialItem, DeviceCommunicationPort } from '../types';
import { api } from '../services/api';

interface BulkDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
  subsystems: Subsystem[];
  systems: System[];
  defaultSystemId?: string;
}

export const BulkDeviceModal: React.FC<BulkDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clients,
  subsystems,
  systems,
  defaultSystemId,
}) => {
  const [formData, setFormData] = useState<BulkDeviceFormData>({
    systemId: defaultSystemId || (systems[0]?.id || ''),
    clientId: clients[0]?.id || '',
    subsystemId: subsystems[0]?.id || '',
    deviceTypeId: '',
    brand: '',
    model: '',
    count: 10,
    startIpAddress: '',
    subnetMask: '',
    gateway: '',
    credentials: [{ title: '', username: '', password: '' }],
    communicationPorts: [{ port: '', service: '' }],
  });

  const [availableTypes, setAvailableTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (formData.subsystemId) {
      api.getDeviceTypes(formData.subsystemId).then(setAvailableTypes).catch(console.error);
    } else {
      setAvailableTypes([]);
    }
  }, [formData.subsystemId]);

  useEffect(() => {
    if (isOpen) {
      const activeSys = systems.find(s => s.id === defaultSystemId) || systems[0];
      setFormData({
        systemId: defaultSystemId || (activeSys?.id || ''),
        clientId: activeSys?.clientId || (clients[0]?.id || ''),
        subsystemId: activeSys?.subsystemId || (subsystems[0]?.id || ''),
        deviceTypeId: '',
        brand: '',
        model: '',
        count: 10,
        startIpAddress: '',
        subnetMask: '',
        gateway: '',
        credentials: [{ title: '', username: '', password: '' }],
        communicationPorts: [{ port: '', service: '' }],
      });
      setError(null);
      setResultMessage(null);
    }
  }, [defaultSystemId, systems, subsystems, clients, isOpen]);

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
      credentials: (prev.credentials || []).filter((_, i) => i !== index),
    }));
  };

  const handleCredentialChange = (index: number, field: keyof DeviceCredentialItem, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.credentials || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, credentials: updated };
    });
  };

  // Port Handlers
  const handleAddPortRow = () => {
    setFormData((prev) => ({
      ...prev,
      communicationPorts: [
        ...(prev.communicationPorts || []),
        { port: '', service: '' },
      ],
    }));
  };

  const handleRemovePortRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      communicationPorts: (prev.communicationPorts || []).filter((_, idx) => idx !== index),
    }));
  };

  const handlePortChange = (index: number, field: keyof DeviceCommunicationPort, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.communicationPorts || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, communicationPorts: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultMessage(null);

    const targetSystemId = defaultSystemId || formData.systemId || systems[0]?.id;

    if (!targetSystemId) {
      setError('El sistema especificado no existe o no se ha seleccionado ninguno');
      setLoading(false);
      return;
    }

    if (!formData.deviceTypeId) {
      setError('El tipo de dispositivo es obligatorio para el alta masiva.');
      setLoading(false);
      return;
    }

    const activeSys = systems.find(s => s.id === targetSystemId);

    const filteredCredentials = formData.credentials
      ?.filter((c) => c.username || c.password || c.title)
      .map((c) => ({
        title: c.title ? c.title.toUpperCase().trim() : '',
        username: c.username ? c.username.trim() : '', // Preservar casing exacto
        password: c.password ? c.password.trim() : '', // Preservar casing exacto
      }));

    const filteredPorts = formData.communicationPorts
      ?.filter((p) => p.port)
      .map((p) => ({
        port: String(p.port).trim(),
        service: p.service ? p.service.toUpperCase().trim() : '',
      }));

    // Convertir datos a MAYÚSCULAS antes de enviar
    const upperFormData: BulkDeviceFormData = {
      systemId: targetSystemId,
      clientId: formData.clientId || activeSys?.clientId,
      subsystemId: formData.subsystemId || activeSys?.subsystemId || subsystems[0]?.id,
      deviceTypeId: formData.deviceTypeId,
      brand: formData.brand ? formData.brand.toUpperCase().trim() : '',
      model: formData.model ? formData.model.toUpperCase().trim() : '',
      count: formData.count || 10,
      startIpAddress: formData.startIpAddress?.trim() || undefined,
      subnetMask: formData.subnetMask?.trim() || undefined,
      gateway: formData.gateway?.trim() || undefined,
      credentials: filteredCredentials && filteredCredentials.length > 0 ? filteredCredentials : undefined,
      communicationPorts: filteredPorts && filteredPorts.length > 0 ? filteredPorts : undefined,
    };

    try {
      const res = await api.createBulkDevices(upperFormData);
      setResultMessage(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers3 color="var(--accent-purple)" size={24} />
            <div>
              <h2>Alta masiva</h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                Genera la cantidad de dispositivos seleccionados para este sistema
              </p>
            </div>
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

            {resultMessage && (
              <div style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: 'var(--accent-emerald)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                {resultMessage}
              </div>
            )}

            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              {/* Subsistema Obligatorio */}
              <div className="form-group">
                <label className="form-label">Subsistema *</label>
                <select
                  className="form-select"
                  value={formData.subsystemId}
                  onChange={(e) => {
                    const newSubsystemId = e.target.value;
                    setFormData({ ...formData, subsystemId: newSubsystemId, deviceTypeId: '' });
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

              {/* Tipo de Dispositivo Obligatorio */}
              <div className="form-group">
                <label className="form-label">Tipo de Dispositivo *</label>
                <select
                  className="form-select"
                  value={formData.deviceTypeId}
                  onChange={(e) => setFormData({ ...formData, deviceTypeId: e.target.value })}
                  required
                  disabled={!formData.subsystemId || availableTypes.length === 0}
                >
                  <option value="">
                    {!formData.subsystemId
                      ? '-- Selecciona primero un Subsistema --'
                      : availableTypes.length === 0
                      ? 'Sin tipos definidos para este subsistema'
                      : '-- Seleccionar Tipo de Dispositivo * --'}
                  </option>
                  {availableTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name}
                    </option>
                  ))}
                </select>
                {formData.subsystemId && availableTypes.length === 0 && (
                  <div style={{ fontSize: '0.775rem', color: 'var(--accent-amber)', marginTop: '0.35rem', fontWeight: 500 }}>
                    ⚠️ No hay tipos de dispositivo para este subsistema. Debes crearlos en <strong>Configuración &gt; Dispositivos</strong>.
                  </div>
                )}
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
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
              </div>

              {/* Parámetros de Red IP (Opcionales para el lote) */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Configuración IP Secuencial (Opcional)
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>IP Inicial (Se incrementará automáticamente)</label>
                  <input
                    type="text"
                    className="form-input code-font"
                    placeholder="ej. 192.168.1.100"
                    value={formData.startIpAddress || ''}
                    onChange={(e) => setFormData({ ...formData, startIpAddress: e.target.value })}
                  />
                </div>

                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 0 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Máscara de Subred</label>
                    <input
                      type="text"
                      className="form-input code-font"
                      placeholder="ej. 255.255.255.0"
                      value={formData.subnetMask || ''}
                      onChange={(e) => setFormData({ ...formData, subnetMask: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Puerta de Enlace</label>
                    <input
                      type="text"
                      className="form-input code-font"
                      placeholder="ej. 192.168.1.1"
                      value={formData.gateway || ''}
                      onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Credenciales de Acceso (Opcionales para el lote) */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <KeyRound size={15} color="var(--accent-amber)" />
                    <label className="form-label" style={{ color: 'var(--accent-amber)', margin: 0, fontSize: '0.775rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Credenciales de Acceso (Común al lote)
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={handleAddCredentialRow}
                  >
                    <Plus size={13} /> Añadir cuenta
                  </button>
                </div>

                {formData.credentials && formData.credentials.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {formData.credentials.map((cred, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-card)', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Etiqueta / Rol (ej: ADMIN, OPERADOR, RTSP)"
                            style={{ fontWeight: 600, fontSize: '0.75rem', padding: '0.2rem 0.5rem', width: '240px' }}
                            value={cred.title || ''}
                            onChange={(e) => handleCredentialChange(idx, 'title', e.target.value)}
                          />
                          {formData.credentials!.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-icon"
                              style={{ padding: '0.2rem 0.35rem' }}
                              title="Eliminar esta credencial"
                              onClick={() => handleRemoveCredentialRow(idx)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 0 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.725rem' }}>Usuario</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="ej. admin"
                              value={cred.username || ''}
                              onChange={(e) => handleCredentialChange(idx, 'username', e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.725rem' }}>Contrase&ntilde;a</label>
                            <input
                              type="password"
                              className="form-input"
                              placeholder="••••••••"
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
                    Sin credenciales. Haz clic en "Añadir cuenta" si deseas asignar usuario/contraseña a todos los equipos.
                  </div>
                )}
              </div>

              {/* Puertos de Comunicación (Opcionales para el lote) */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Network size={15} color="var(--accent-cyan)" />
                    <label className="form-label" style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '0.775rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Puertos de Comunicaci&oacute;n (HTTP, RTSP, SSH, etc.)
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={handleAddPortRow}
                  >
                    <Plus size={13} /> Añadir puerto
                  </button>
                </div>

                {formData.communicationPorts && formData.communicationPorts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {formData.communicationPorts.map((pItem, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input code-font"
                          placeholder="Puerto (ej: 80, 554, 8000)"
                          style={{ width: '160px', fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                          value={pItem.port}
                          onChange={(e) => handlePortChange(idx, 'port', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Servicio / Protocolo (ej: HTTP, RTSP, SDK, SSH)"
                          style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                          value={pItem.service || ''}
                          onChange={(e) => handlePortChange(idx, 'service', e.target.value)}
                        />
                        {formData.communicationPorts!.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            style={{ padding: '0.35rem' }}
                            title="Eliminar este puerto"
                            onClick={() => handleRemovePortRow(idx)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Sin puertos adicionales. Haz clic en "Añadir puerto" para asociar puertos estándar al lote.
                  </div>
                )}
              </div>

              {/* Cantidad */}
              <div className="form-group">
                <label className="form-label">Cantidad de Dispositivos a Generar *</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={500}
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              <Zap size={16} />
              {loading ? 'Generando...' : `Crear ${formData.count} Dispositivos`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
