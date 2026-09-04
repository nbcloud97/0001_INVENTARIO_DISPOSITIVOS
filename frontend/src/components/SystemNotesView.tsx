import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Edit2, Trash2, Calendar } from 'lucide-react';
import { SystemNote } from '../types';
import { api } from '../services/api';
import { SystemNoteModal } from './SystemNoteModal';
import { ConfirmModal } from './ConfirmModal';

interface SystemNotesViewProps {
  systemId: string;
  systemName?: string;
}

export const SystemNotesView: React.FC<SystemNotesViewProps> = ({ systemId }) => {
  const [notes, setNotes] = useState<SystemNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<SystemNote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<SystemNote | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemNotes(systemId);
      setNotes(data);
    } catch (err: any) {
      console.error('Error al cargar notas del sistema:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (systemId) {
      loadNotes();
    }
  }, [systemId]);

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setDeleteLoading(true);
    try {
      const targetId = noteToDelete.id;
      setNotes((prev) => prev.filter((n) => n.id !== targetId));
      await api.deleteSystemNote(targetId);
      setNoteToDelete(null);
      await loadNotes();
    } catch (err: any) {
      alert(`Error al eliminar nota: ${err.message}`);
      await loadNotes();
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      (n.title && n.title.toLowerCase().includes(term)) ||
      n.content.toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
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
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setNoteToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} /> Nueva Nota
        </button>
      </div>

      {/* Tabla de Notas */}
      <div className="table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Cargando notas del sistema...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-icon" />
            <h3>No hay notas registradas</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Registra anotaciones técnicas, intervenciones o detalles sobre este sistema.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Título</th>
                  <th>Contenido / Observaciones</th>
                  <th style={{ width: '180px' }}>Fecha de Carga</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.map((note) => (
                  <tr key={note.id}>
                    {/* Título de la nota */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <FileText size={18} color="var(--accent-blue)" />
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {note.title || 'NOTA GENERAL'}
                        </span>
                      </div>
                    </td>

                    {/* Contenido / Observaciones */}
                    <td>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>
                        {note.content}
                      </div>
                    </td>

                    {/* Fecha de carga */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {formatDate(note.createdAt)}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          title="Editar Nota"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteToEdit(note);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-icon"
                          title="Eliminar Nota"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteToDelete(note);
                          }}
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

      <SystemNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadNotes}
        systemId={systemId}
        noteToEdit={noteToEdit}
        onDelete={(note) => setNoteToDelete(note)}
      />

      <ConfirmModal
        isOpen={Boolean(noteToDelete)}
        title="Eliminar Nota del Sistema"
        message={`¿Estás seguro de que deseas eliminar la nota "${noteToDelete?.title || 'NOTA GENERAL'}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
        loading={deleteLoading}
      />
    </div>
  );
};
