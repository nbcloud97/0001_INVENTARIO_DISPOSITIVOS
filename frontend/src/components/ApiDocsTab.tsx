import React, { useState } from 'react';
import { Code, ExternalLink, Copy, Check } from 'lucide-react';

export const ApiDocsTab: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const swaggerUrl = 'http://localhost:3001/api/docs';

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/devices',
      desc: 'Obtiene el inventario completo de dispositivos. Permite filtrar por clientId, subsystemId y término de búsqueda.',
      curl: 'curl -X GET "http://localhost:3001/api/v1/devices?clientId=UUID_CLIENTE"',
    },
    {
      method: 'POST',
      path: '/api/v1/devices/bulk',
      desc: 'Creación masiva de N dispositivos (asistente de lote) con incremento de IP y nombres.',
      curl: `curl -X POST "http://localhost:3001/api/v1/devices/bulk" \\
  -H "Content-Type: application/json" \\
  -d '{"clientId":"UUID","subsystemId":"UUID","brand":"Hikvision","model":"DS-2CD2143G0-I","baseName":"CAM_","count":20,"startIpAddress":"192.168.1.100"}'`,
    },
    {
      method: 'GET',
      path: '/api/v1/devices/{id}/credentials',
      desc: 'Obtiene y descifra (AES-256) las credenciales de acceso de un dispositivo específico.',
      curl: 'curl -X GET "http://localhost:3001/api/v1/devices/ID_DISPOSITIVO/credentials"',
    },
    {
      method: 'GET',
      path: '/api/v1/clients',
      desc: 'Lista todos los clientes registrados y el conteo total de dispositivos asociados.',
      curl: 'curl -X GET "http://localhost:3001/api/v1/clients"',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Code size={24} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.4rem' }}>API REST para Integraci&oacute;n de Terceros</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '650px' }}>
            API RESTful documentada bajo la especificaci&oacute;n OpenAPI 3.0 (Swagger). Permite a sistemas externos (ERP, CRM, Monitoreo SNMP/Zabbix) registrar y consultar clientes, subsistemas y dispositivos.
          </p>
        </div>

        <a
          href={swaggerUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          style={{ textDecoration: 'none' }}
        >
          <ExternalLink size={16} /> Abrir Swagger UI Interactivo
        </a>
      </div>

      {/* Endpoints List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {endpoints.map((ep, idx) => (
          <div
            key={idx}
            className="table-card"
            style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-secondary)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    background: ep.method === 'GET' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: ep.method === 'GET' ? 'var(--accent-emerald)' : 'var(--accent-blue)',
                    border: `1px solid ${ep.method === 'GET' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                  }}
                >
                  {ep.method}
                </span>
                <span className="code-font" style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {ep.path}
                </span>
              </div>

              <button
                className="btn btn-secondary btn-icon"
                title="Copiar cURL"
                onClick={() => handleCopy(ep.curl)}
              >
                {copiedEndpoint === ep.curl ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              {ep.desc}
            </p>

            <pre
              className="code-font"
              style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                overflowX: 'auto',
                fontSize: '0.8rem',
                color: 'var(--accent-cyan)',
              }}
            >
              {ep.curl}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
