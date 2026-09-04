import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { SystemNote } from '../types';
import { api } from '../services/api';
import { SystemNoteModal } from './SystemNoteModal';

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar esta nota permanentemente?')) return;
    try {
      await api.deleteSystemNote(id);
      loadNotes();
    } catch (err: any) {
      alert(`Error al eliminar nota: ${err.message}`);
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
            placeholder="Buscar en las notas del sistema..."
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

      {/* Grid de Tarjetas de Notas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Cargando notas del sistema...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="table-card">
          <div className="empty-state">
            <FileText className="empty-icon" />
            <h3>No hay notas registradas</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Registra anotaciones técnicas, intervenciones o detalles sobre este sistema.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.1rem' }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                {/* Header de la tarjeta */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--accent-blue)" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {note.title || 'NOTA GENERAL'}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      style={{ padding: '0.2rem 0.4rem' }}
                      title="Editar Nota"
                      onClick={() => {
                        setNoteToEdit(note);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-icon"
                      style={{ padding: '0.2rem 0.4rem' }}
                      title="Eliminar Nota"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Contenido de la nota */}
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    background: 'var(--bg-primary)',
                    padding: '0.85rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    minHeight: '80px',
                  }}
                >
                  {note.content}
                </div>
              </div>

              {/* Footer con fecha */}
              <div
                style={{
                  marginTop: '0.85rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px dashed var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} />
                  <span>{formatDate(note.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SystemNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadNotes}
        systemId={systemId}
        noteToEdit={noteToEdit}
      />
    </div>
  );
};
