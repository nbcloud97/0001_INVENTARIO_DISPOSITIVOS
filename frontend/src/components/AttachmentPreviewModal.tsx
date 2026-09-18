import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Archive,
  File,
  Copy,
  Check,
  Loader2,
  Search,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SystemAttachment } from '../types';
import { api } from '../services/api';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: SystemAttachment | null;
}

interface ExcelWorkbookData {
  sheetNames: string[];
  sheets: { [sheetName: string]: (string | number)[][] };
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachment,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<ExcelWorkbookData | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [excelSearch, setExcelSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Helper para clasificar la extensión / tipo de archivo
  const getFileType = (filename: string, mimeType: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext) || mimeType.startsWith('image/')) {
      return 'image';
    }
    if (ext === 'pdf' || mimeType.includes('pdf')) {
      return 'pdf';
    }
    if (
      ['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'].includes(ext) ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel')
    ) {
      return 'excel';
    }
    if (
      ['txt', 'log', 'json', 'csv', 'md', 'xml', 'html', 'css', 'js', 'ts', 'py', 'sh', 'env', 'ini', 'conf', 'yaml', 'yml'].includes(ext) ||
      mimeType.startsWith('text/')
    ) {
      return 'text';
    }
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext) || mimeType.startsWith('video/')) {
      return 'video';
    }
    if (['mp3', 'wav', 'aac', 'flac'].includes(ext) || mimeType.startsWith('audio/')) {
      return 'audio';
    }
    return 'other';
  };

  useEffect(() => {
    let currentBlobUrl: string | null = null;

    const loadContent = async () => {
      if (!attachment || !isOpen) return;

      setLoading(true);
      setError(null);
      setBlobUrl(null);
      setTextContent(null);
      setExcelData(null);
      setActiveSheet('');
      setExcelSearch('');

      const type = getFileType(attachment.filename, attachment.mimeType);

      try {
        if (type === 'excel') {
          const blob = await api.getAttachmentBlob(attachment.id);
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });

          const sheetsMap: { [sheetName: string]: (string | number)[][] } = {};
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
              header: 1,
              defval: '',
              blankrows: false,
            });
            sheetsMap[sheetName] = rawRows;
          });

          setExcelData({
            sheetNames: workbook.SheetNames,
            sheets: sheetsMap,
          });

          if (workbook.SheetNames.length > 0) {
            setActiveSheet(workbook.SheetNames[0]);
          }
        } else if (type === 'text') {
          const text = await api.getAttachmentText(attachment.id);
          setTextContent(text);
        } else if (type === 'image' || type === 'pdf' || type === 'video' || type === 'audio') {
          const blob = await api.getAttachmentBlob(attachment.id);
          currentBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(currentBlobUrl);
        }
      } catch (err: any) {
        console.error('Error al cargar previsualización:', err);
        setError(err.message || 'No se pudo cargar la previsualización del archivo.');
      } finally {
        setLoading(false);
      }
    };

    loadContent();

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [attachment, isOpen]);

  // Listener para cerrar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtrado de filas de la hoja activa de Excel
  const currentSheetRows = useMemo(() => {
    if (!excelData || !activeSheet || !excelData.sheets[activeSheet]) return [];
    const allRows = excelData.sheets[activeSheet];
    if (!excelSearch.trim() || allRows.length <= 1) return allRows;

    const term = excelSearch.toLowerCase();
    const headerRow = allRows[0];
    const dataRows = allRows.slice(1);

    const filteredData = dataRows.filter((row) =>
      row.some((cell) => cell !== undefined && cell !== null && String(cell).toLowerCase().includes(term))
    );

    return [headerRow, ...filteredData];
  }, [excelData, activeSheet, excelSearch]);

  if (!isOpen || !attachment) return null;

  const fileType = getFileType(attachment.filename, attachment.mimeType);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <ImageIcon size={22} color="var(--accent-purple)" />;
      case 'pdf':
        return <FileText size={22} color="var(--accent-rose)" />;
      case 'excel':
        return <FileSpreadsheet size={22} color="var(--accent-emerald)" />;
      case 'text':
        return <FileText size={22} color="var(--accent-blue)" />;
      case 'video':
      case 'audio':
        return <File size={22} color="var(--accent-amber)" />;
      default:
        const ext = attachment.filename.split('.').pop()?.toLowerCase();
        if (['zip', 'rar', '7z'].includes(ext || '')) return <Archive size={22} color="var(--accent-amber)" />;
        return <File size={22} color="var(--accent-cyan)" />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: fileType === 'excel' ? '1200px' : fileType === 'pdf' ? '980px' : fileType === 'image' ? '900px' : '820px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de Previsualización */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--header-bg)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg-card-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {renderFileIcon()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={attachment.filename}
              >
                {attachment.filename}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span>{formatFileSize(attachment.fileSize)}</span>
                <span>•</span>
                <span>
                  {fileType === 'excel'
                    ? 'Libro de cálculo Excel'
                    : attachment.mimeType || 'Archivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción Superior */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {fileType === 'text' && textContent && (
              <button
                className="btn btn-secondary btn-icon"
                onClick={handleCopyText}
                title="Copiar texto al portapapeles"
              >
                {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
              </button>
            )}

            <a
              href={api.getAttachmentDownloadUrl(attachment.id)}
              download={attachment.filename}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Descargar archivo completo"
            >
              <Download size={15} /> Descargar
            </a>

            <button
              className="btn btn-secondary btn-icon"
              onClick={onClose}
              title="Cerrar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de herramientas para Excel (Pestañas de hojas y buscador) */}
        {fileType === 'excel' && excelData && excelData.sheetNames.length > 0 && (
          <div
            style={{
              padding: '0.65rem 1.25rem',
              background: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {/* Pestañas de Hojas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', maxWidth: '65%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '0.3rem' }}>
                <Layers size={14} /> Hojas:
              </div>
              {excelData.sheetNames.map((name) => {
                const isActive = name === activeSheet;
                const rowsCount = excelData.sheets[name]?.length || 0;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setActiveSheet(name);
                      setExcelSearch('');
                    }}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? 'var(--accent-blue)' : 'var(--bg-card)',
                      color: isActive ? '#fff' : 'var(--text-primary)',
                      border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        opacity: isActive ? 0.9 : 0.6,
                        background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                      }}
                    >
                      {rowsCount > 0 ? rowsCount - 1 : 0} filas
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Buscador de celda dentro de la hoja */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Buscar en esta hoja..."
                value={excelSearch}
                onChange={(e) => setExcelSearch(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.65rem 0.35rem 2rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Cuerpo Principal de Previsualización */}
        <div
          style={{
            flex: 1,
            padding: fileType === 'excel' ? '0' : '1.25rem',
            overflowY: 'auto',
            background: 'var(--bg-body)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: fileType === 'excel' ? 'stretch' : 'center',
            justifyContent: fileType === 'excel' ? 'flex-start' : 'center',
            minHeight: '380px',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem', margin: 'auto' }}>
              <Loader2 size={32} className="spin-animation" style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }} />
              <div>Cargando vista previa de <strong>{attachment.filename}</strong>...</div>
            </div>
          ) : error ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                maxWidth: '450px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                color: 'var(--accent-rose)',
                margin: 'auto',
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No se pudo cargar la vista previa</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{error}</p>
              <a
                href={api.getAttachmentDownloadUrl(attachment.id)}
                className="btn btn-primary"
                download={attachment.filename}
                style={{ textDecoration: 'none' }}
              >
                <Download size={15} /> Descargar Archivo Directamente
              </a>
            </div>
          ) : fileType === 'excel' && currentSheetRows.length > 0 ? (
            /* Vista previa interactiva de Excel */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
              <div
                style={{
                  flex: 1,
                  maxHeight: '68vh',
                  overflow: 'auto',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <table
                  style={{
                    width: 'max-content',
                    minWidth: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                    fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        background: '#1e293b',
                        color: '#f8fafc',
                      }}
                    >
                      {/* Columna índice de fila */}
                      <th
                        style={{
                          padding: '0.55rem 0.65rem',
                          border: '1px solid #334155',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          width: '45px',
                          background: '#0f172a',
                          color: '#94a3b8',
                          userSelect: 'none',
                        }}
                      >
                        #
                      </th>
                      {currentSheetRows[0].map((headerVal, colIdx) => (
                        <th
                          key={colIdx}
                          style={{
                            padding: '0.55rem 0.85rem',
                            border: '1px solid #334155',
                            textAlign: 'left',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            background: '#1e293b',
                            color: '#f8fafc',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {headerVal !== undefined && headerVal !== null && headerVal !== ''
                            ? String(headerVal)
                            : `Columna ${colIdx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheetRows.slice(1).map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        style={{
                          background: rowIdx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            rowIdx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)')
                        }
                      >
                        {/* Número de fila */}
                        <td
                          style={{
                            padding: '0.45rem 0.5rem',
                            border: '1px solid var(--border-color)',
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-tertiary)',
                            userSelect: 'none',
                          }}
                        >
                          {rowIdx + 2}
                        </td>
                        {currentSheetRows[0].map((_, colIdx) => {
                          const cellVal = row[colIdx];
                          return (
                            <td
                              key={colIdx}
                              style={{
                                padding: '0.45rem 0.85rem',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {cellVal !== undefined && cellVal !== null ? String(cellVal) : ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Barra de estado inferior de la hoja Excel */}
              <div
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'var(--bg-tertiary)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  Mostrando <strong>{currentSheetRows.length > 0 ? currentSheetRows.length - 1 : 0}</strong> filas y{' '}
                  <strong>{currentSheetRows[0]?.length || 0}</strong> columnas
                  {excelSearch && ` (filtrado por "${excelSearch}")`}
                </span>
                <span>Hoja activa: <strong>{activeSheet}</strong></span>
              </div>
            </div>
          ) : fileType === 'excel' && currentSheetRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', margin: 'auto' }}>
              <FileSpreadsheet size={36} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <div>La hoja seleccionada está vacía.</div>
            </div>
          ) : fileType === 'image' && blobUrl ? (
            /* Vista previa de Imágenes */
            <div style={{ textAlign: 'center', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img
                src={blobUrl}
                alt={attachment.filename}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                }}
              />
            </div>
          ) : fileType === 'pdf' && blobUrl ? (
            /* Vista previa de PDF */
            <iframe
              src={blobUrl}
              title={attachment.filename}
              style={{
                width: '100%',
                height: '72vh',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: '#fff',
              }}
            />
          ) : fileType === 'text' && textContent !== null ? (
            /* Vista previa de Archivos de Texto / Código / JSON / CSV */
            <div style={{ width: '100%' }}>
              <pre
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  maxHeight: '68vh',
                  overflow: 'auto',
                  fontFamily: 'Consolas, Monaco, "Fira Code", monospace',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {textContent || '(El archivo de texto está vacío)'}
              </pre>
            </div>
          ) : fileType === 'video' && blobUrl ? (
            /* Vista previa de Vídeo */
            <video
              controls
              autoPlay={false}
              src={blobUrl}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px',
                outline: 'none',
              }}
            />
          ) : fileType === 'audio' && blobUrl ? (
            /* Vista previa de Audio */
            <div style={{ padding: '3rem 2rem', textAlign: 'center', width: '100%', maxWidth: '500px', margin: 'auto' }}>
              <div style={{ marginBottom: '1.5rem', color: 'var(--accent-amber)' }}>
                <File size={48} />
              </div>
              <audio controls src={blobUrl} style={{ width: '100%' }} />
            </div>
          ) : (
            /* Vista previa No Disponible Directamente (Ej: Word, ZIP, CAD, Binarios) */
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                maxWidth: '520px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-sm)',
                margin: 'auto',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--bg-card-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                {renderFileIcon()}
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Vista previa no integrada para este formato
              </h3>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                Los archivos con formato <strong>.{attachment.filename.split('.').pop()?.toUpperCase() || 'documento'}</strong> no se pueden renderizar directamente en el navegador. Puedes descargarlo para abrirlo localmente.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <a
                  href={api.getAttachmentDownloadUrl(attachment.id)}
                  download={attachment.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', padding: '0.6rem 1.25rem' }}
                >
                  <Download size={16} /> Descargar Archivo ({formatFileSize(attachment.fileSize)})
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
