import React, { useState, useEffect } from 'react';
import { X, Layers3, Zap, CheckCircle2 } from 'lucide-react';
import { Client, Subsystem, System, BulkDeviceFormData, DeviceType } from '../types';
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
      });
      setError(null);
      setResultMessage(null);
    }
  }, [defaultSystemId, systems, subsystems, clients, isOpen]);

  if (!isOpen) return null;

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

    // Convertir datos a MAYÚSCULAS antes de enviar
    const upperFormData: BulkDeviceFormData = {
      systemId: targetSystemId,
      clientId: formData.clientId || activeSys?.clientId,
      subsystemId: formData.subsystemId || activeSys?.subsystemId || subsystems[0]?.id,
      deviceTypeId: formData.deviceTypeId,
      brand: formData.brand ? formData.brand.toUpperCase().trim() : '',
      model: formData.model ? formData.model.toUpperCase().trim() : '',
      count: formData.count || 10,
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
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
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

              {/* Cantidad */}
              <div className="form-group">
                <label className="form-label">Cantidad *</label>
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
