import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { SystemNote } from '../types';
import { api } from '../services/api';

interface SystemNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  systemId: string;
  noteToEdit?: SystemNote | null;
}

export const SystemNoteModal: React.FC<SystemNoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  systemId,
  noteToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
    } else {
      setTitle('');
      setContent('');
    }
    setError(null);
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('El contenido de la nota es obligatorio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (noteToEdit) {
        await api.updateSystemNote(noteToEdit.id, {
          title: title.trim(),
          content: content.trim(),
        });
      } else {
        await api.createSystemNote({
          systemId,
          title: title.trim(),
          content: content.trim(),
        });
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
      <div className="modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText color="var(--accent-blue)" size={22} />
            <h2>{noteToEdit ? 'Editar Nota del Sistema' : 'Nueva Nota del Sistema'}</h2>
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

            {/* Título o Asunto */}
            <div className="form-group">
              <label className="form-label">T&iacute;tulo / Asunto de la Nota</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Contenido Obligatorio */}
            <div className="form-group">
              <label className="form-label">Contenido de la Nota *</label>
              <textarea
                className="form-textarea"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : noteToEdit ? 'Actualizar Nota' : 'Guardar Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
