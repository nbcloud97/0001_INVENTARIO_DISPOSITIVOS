import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Paperclip, FileText, Image as ImageIcon, FileSpreadsheet, Archive, Trash2, Download, Calendar, File, Eye } from 'lucide-react';
import { SystemAttachment } from '../types';
import { api } from '../services/api';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';

interface SystemAttachmentsViewProps {
  systemId: string;
  systemName?: string;
}

export const SystemAttachmentsView: React.FC<SystemAttachmentsViewProps> = ({ systemId }) => {
  const [attachments, setAttachments] = useState<SystemAttachment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<SystemAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemAttachments(systemId);
      setAttachments(data);
    } catch (err: any) {
      console.error('Error al cargar adjuntos del sistema:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (systemId) {
      loadAttachments();
    }
  }, [systemId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await api.uploadSystemAttachment(systemId, file);
      loadAttachments();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!window.confirm(`¿Deseas eliminar permanentemente el archivo "${filename}"?`)) return;
    try {
      await api.deleteSystemAttachment(id);
      loadAttachments();
    } catch (err: any) {
      alert(`Error al eliminar archivo: ${err.message}`);
    }
  };

  const filteredAttachments = attachments.filter((a) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return a.filename.toLowerCase().includes(term);
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  const getFileIcon = (filename: string, mimeType: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '') || mimeType.startsWith('image/')) {
      return <ImageIcon size={20} color="var(--accent-purple)" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext || '') || mimeType.includes('sheet') || mimeType.includes('csv')) {
      return <FileSpreadsheet size={20} color="var(--accent-emerald)" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext || '') || mimeType.includes('pdf')) {
      return <FileText size={20} color="var(--accent-blue)" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <Archive size={20} color="var(--accent-amber)" />;
    }
    return <File size={20} color="var(--accent-cyan)" />;
  };

  return (
    <div>
      {/* Toolbar superior */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-search"
            placeholder="Buscar en los archivos adjuntos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? 'Subiendo...' : 'Adjuntar Archivo'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--accent-rose)',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Tabla de Archivos Adjuntos */}
      <div className="table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Cargando archivos adjuntos...
          </div>
        ) : filteredAttachments.length === 0 ? (
          <div className="empty-state">
            <Paperclip className="empty-icon" />
            <h3>No hay archivos adjuntos</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Adjunta esquemas técnicos, planos de planta, manuales o certificados relativos a este sistema.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Nombre del Archivo</th>
                  <th>Tamaño</th>
                  <th>Fecha de Carga</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttachments.map((file) => (
                  <tr key={file.id}>
                    {/* Nombre del archivo con icono según su tipo */}
                    <td>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
                        onClick={() => setPreviewAttachment(file)}
                        title="Hacer clic para previsualizar archivo"
                      >
                        {getFileIcon(file.filename, file.mimeType)}
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                              transition: 'color 0.2s',
                            }}
                            className="filename-link"
                          >
                            {file.filename}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {file.mimeType}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tamaño del archivo */}
                    <td>
                      <span className="code-font" style={{ fontSize: '0.8rem' }}>
                        {formatFileSize(file.fileSize)}
                      </span>
                    </td>

                    {/* Fecha de creación */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {formatDate(file.createdAt)}
                      </div>
                    </td>

                    {/* Acciones: Previsualizar, Descargar & Eliminar */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Previsualizar archivo"
                          onClick={() => setPreviewAttachment(file)}
                        >
                          <Eye size={15} color="var(--accent-purple)" />
                        </button>
                        <a
                          href={api.getAttachmentDownloadUrl(file.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-icon"
                          title="Descargar archivo"
                          download={file.filename}
                          style={{ textDecoration: 'none' }}
                        >
                          <Download size={15} color="var(--accent-blue)" />
                        </a>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Eliminar archivo adjunto"
                          onClick={() => handleDelete(file.id, file.filename)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Previsualización */}
      <AttachmentPreviewModal
        isOpen={Boolean(previewAttachment)}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
      />
    </div>
  );
};
