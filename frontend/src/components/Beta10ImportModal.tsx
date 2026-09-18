import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Search,
  CheckSquare,
  Square,
  Building2,
  Cpu,
  Layers,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  Beta10ClientSearchResult,
  Beta10ClientDetails,
  Beta10SystemItem,
} from '../types';
import { api } from '../services/api';

interface Beta10ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialClientId?: number | null;
  initialSearchTerm?: string;
}

export const Beta10ImportModal: React.FC<Beta10ImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialClientId,
  initialSearchTerm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Beta10ClientSearchResult[]>([]);
  const [selectedClient, setSelectedClient] = useState<Beta10ClientDetails | null>(null);
  const [selectedSystemIds, setSelectedSystemIds] = useState<number[]>([]);

  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Limpiar estado y cargar datos iniciales al abrir
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      setSelectedSystemIds([]);

      if (initialClientId && !isNaN(initialClientId)) {
        setSearchTerm('');
        setSearchResults([]);
        handleSelectClient(initialClientId);
      } else {
        setSelectedClient(null);
        const term = initialSearchTerm || '';
        setSearchTerm(term);
        handleSearch(term);
      }
    }
  }, [isOpen, initialClientId, initialSearchTerm]);

  if (!isOpen) return null;

  const handleSearch = async (term: string) => {
    setSearching(true);
    setError(null);
    try {
      const results = await api.searchBeta10Clients(term, 40);
      setSearchResults(results.sort((a, b) => a.idcliente - b.idcliente));
    } catch (err: any) {
      setError(err.message || 'Error al consultar clientes en Beta 10');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectClient = async (idcliente: number) => {
    setLoadingDetails(true);
    setError(null);
    try {
      const details = await api.getBeta10ClientSystems(idcliente);
      setSelectedClient(details);
      
      // Pre-seleccionar sistemas activos no importados previamente (o todos los activos si no hay ninguno importado)
      const newActiveSystemIds = details.systems
        .filter((s) => (s.estado === 1 || s.estado === undefined) && !s.alreadyImported)
        .map((s) => s.idsistema);

      if (newActiveSystemIds.length > 0) {
        setSelectedSystemIds(newActiveSystemIds);
      } else {
        const allActiveSystemIds = details.systems
          .filter((s) => s.estado === 1 || s.estado === undefined)
          .map((s) => s.idsistema);
        setSelectedSystemIds(allActiveSystemIds);
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener sistemas de Beta 10');
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleSelectAllSystems = () => {
    if (!selectedClient) return;
    if (selectedSystemIds.length === selectedClient.systems.length) {
      setSelectedSystemIds([]);
    } else {
      setSelectedSystemIds(selectedClient.systems.map((s) => s.idsistema));
    }
  };

  const toggleSystemSelection = (idsistema: number) => {
    if (selectedSystemIds.includes(idsistema)) {
      setSelectedSystemIds(selectedSystemIds.filter((id) => id !== idsistema));
    } else {
      setSelectedSystemIds([...selectedSystemIds, idsistema]);
    }
  };

  const handleImport = async () => {
    if (!selectedClient) return;
    setImporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await api.importBeta10Client(
        selectedClient.idcliente,
        selectedSystemIds
      );
      setSuccessMessage(
        `Cliente "${result.client.name}" importado correctamente con ${result.createdSystemsCount} sistemas nuevos y ${result.updatedSystemsCount} actualizados.`
      );
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al importar desde Beta 10');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(234, 88, 12, 0.15)',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Importar desde Beta 10</h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: 'rgba(234, 88, 12, 0.12)',
                    color: '#ea580c',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(234, 88, 12, 0.25)',
                  }}
                >
                  Oracle ERP
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Importa clientes y sus sistemas técnicos directamente desde la base de datos de Beta 10
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-rose)',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-emerald)',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Estado de Carga de Detalles */}
          {loadingDetails && !selectedClient ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-animate" style={{ marginBottom: '0.75rem', display: 'inline-block', color: 'var(--accent-blue)' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Consultando sistemas del cliente en Beta 10...
              </p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Conectando con la base de datos Oracle de Beta 10
              </p>
            </div>
          ) : !selectedClient ? (
            /* VISTA 1: Buscador y Listado de Clientes de Beta 10 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Barra de búsqueda */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="Buscar por ID de Beta 10, Nombre Comercial, Razón Social o NIF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(searchTerm);
                      }
                    }}
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSearch(searchTerm)}
                  disabled={searching}
                >
                  {searching ? <RefreshCw size={15} className="spin-animate" /> : <Search size={15} />} Buscar
                </button>
              </div>

              {/* Tabla de resultados */}
              <div className="table-card" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {searching ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spin-animate" style={{ marginBottom: '0.5rem', display: 'inline-block' }} />
                    <p>Consultando base de datos Oracle de Beta 10...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <Building2 className="empty-icon" size={36} />
                    <h3>No se encontraron clientes</h3>
                    <p style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
                      Prueba con otro término de búsqueda o deja el campo vacío para ver los más recientes.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="device-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '90px' }}>ID Beta 10</th>
                          <th>Nombre Comercial</th>
                          <th>Razón Social</th>
                          <th style={{ width: '110px' }}>NIF</th>
                          <th style={{ width: '90px', textAlign: 'center' }}>Sistemas</th>
                          <th style={{ width: '100px', textAlign: 'right' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((c) => (
                          <tr
                            key={c.idcliente}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSelectClient(c.idcliente)}
                          >
                            <td>
                              <span
                                className="code-font"
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--accent-purple)',
                                  background: 'rgba(168, 85, 247, 0.12)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(168, 85, 247, 0.25)',
                                }}
                              >
                                {c.idcliente}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {c.nombre}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {c.razonSocial || '-'}
                              </span>
                            </td>
                            <td>
                              <span className="code-font">{c.cif || '-'}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: c.totalSistemas > 0 ? 'rgba(0, 85, 150, 0.15)' : 'var(--bg-secondary)',
                                  color: c.totalSistemas > 0 ? 'var(--accent-blue)' : 'var(--text-muted)',
                                }}
                              >
                                {c.totalSistemas}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectClient(c.idcliente);
                                }}
                              >
                                Seleccionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VISTA 2: Vista previa del Cliente y Selector de Sistemas */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Botón Volver a buscar */}
              <div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => setSelectedClient(null)}
                >
                  <ArrowLeft size={14} /> Cambiar de cliente
                </button>
              </div>

              {/* Ficha resumen del Cliente */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Building2 color="var(--accent-blue)" size={22} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          className="code-font"
                          style={{
                            fontWeight: 700,
                            color: 'var(--accent-purple)',
                            background: 'rgba(168, 85, 247, 0.15)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            fontSize: '0.85rem',
                          }}
                        >
                          ID: {selectedClient.idcliente}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedClient.nombre}</h3>
                      </div>
                      {selectedClient.razonSocial && (
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          Fiscal: {selectedClient.razonSocial} {selectedClient.cif ? `| NIF: ${selectedClient.cif}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedClient.alreadyImportedClient ? (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--accent-emerald)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <CheckCircle2 size={13} /> Ya existe en Inventario
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(2, 132, 199, 0.15)',
                        color: 'var(--accent-cyan)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        border: '1px solid rgba(2, 132, 199, 0.3)',
                      }}
                    >
                      + Nuevo en Inventario
                    </span>
                  )}
                </div>

                {selectedClient.observaciones && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                    <strong>Notas en Beta 10:</strong> {selectedClient.observaciones}
                  </div>
                )}
              </div>

              {/* Lista y selector de sistemas de Beta 10 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu size={16} color="var(--accent-blue)" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
                      Sistemas disponibles en Beta 10 ({selectedClient.systems.length})
                    </h4>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                    onClick={toggleSelectAllSystems}
                  >
                    {selectedSystemIds.length === selectedClient.systems.length
                      ? 'Deseleccionar todos'
                      : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="table-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedClient.systems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Este cliente no tiene sistemas registrados en Beta 10. Se importará solo la ficha del cliente.
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="device-table" style={{ fontSize: '0.825rem' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={
                                  selectedClient.systems.length > 0 &&
                                  selectedSystemIds.length === selectedClient.systems.length
                                }
                                onChange={toggleSelectAllSystems}
                                style={{ cursor: 'pointer' }}
                              />
                            </th>
                            <th style={{ width: '90px' }}>Código</th>
                            <th>Descripción / Sistema</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>Estado</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Inventario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClient.systems.map((sys) => {
                            const isSelected = selectedSystemIds.includes(sys.idsistema);
                            return (
                              <tr
                                key={sys.idsistema}
                                style={{
                                  background: isSelected ? 'rgba(0, 85, 150, 0.04)' : undefined,
                                  cursor: 'pointer',
                                }}
                                onClick={() => toggleSystemSelection(sys.idsistema)}
                              >
                                <td style={{ textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSystemSelection(sys.idsistema)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ cursor: 'pointer' }}
                                  />
                                </td>
                                <td>
                                  <span className="code-font" style={{ fontWeight: 600 }}>
                                    {sys.codigo || `ID-${sys.idsistema}`}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontWeight: 600 }}>{sys.descripcion}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span
                                    style={{
                                      fontSize: '0.725rem',
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '9999px',
                                      fontWeight: 600,
                                      background:
                                        sys.estado === 1
                                          ? 'rgba(16, 185, 129, 0.15)'
                                          : 'rgba(239, 68, 68, 0.15)',
                                      color:
                                        sys.estado === 1
                                          ? 'var(--accent-emerald)'
                                          : 'var(--accent-rose)',
                                    }}
                                  >
                                    {sys.estado === 1 ? 'Activo' : 'Baja'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {sys.alreadyImported ? (
                                    <span
                                      style={{
                                        fontSize: '0.725rem',
                                        color: 'var(--accent-emerald)',
                                        fontWeight: 600,
                                      }}
                                    >
                                      ✓ Importado
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: '0.725rem',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {selectedClient && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {selectedSystemIds.length} de {selectedClient.systems.length} sistemas seleccionados
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            {selectedClient && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={importing}
                style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  borderColor: '#ea580c',
                }}
              >
                {importing ? (
                  <>
                    <RefreshCw size={15} className="spin-animate" /> Importando...
                  </>
                ) : (
                  <>
                    <Database size={15} /> Importar desde Beta 10
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
