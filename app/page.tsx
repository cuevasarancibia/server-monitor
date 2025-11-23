'use client';

import { useState, useEffect } from 'react';

interface ServerConfig {
  name: string;
  host: string;
  username: string;
  password: string;
  port: number;
}

export default function Home() {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Cargar servidores del localStorage al iniciar
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('servers');
    if (saved) {
      try {
        setServers(JSON.parse(saved));
      } catch (e) {
        console.error('Error al cargar servidores:', e);
      }
    }
  }, []);

  // Guardar servidores en localStorage cuando cambian
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('servers', JSON.stringify(servers));
    }
  }, [servers, isClient]);

  const [newServer, setNewServer] = useState<ServerConfig>({
    name: '',
    host: '',
    username: '',
    password: '',
    port: 22,
  });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const addServer = () => {
    if (newServer.name && newServer.host && newServer.username && newServer.password) {
      setServers([...servers, { ...newServer }]);
      setNewServer({
        name: '',
        host: '',
        username: '',
        password: '',
        port: 22,
      });
    }
  };

  const removeServer = (index: number) => {
    setServers(servers.filter((_, i) => i !== index));
  };

  const checkServer = async (server: ServerConfig) => {
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/check-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: server.host,
          username: server.username,
          password: server.password,
          port: server.port,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        status: 'error',
        error: 'Error al conectar con el servidor',
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para categorizar los resultados
  const categorizeResults = (data: any) => {
    const categories: any = {
      'Sistema y Hardware': [],
      'Memoria y Disco': [],
      'Procesos': [],
      'Red y Puertos': [],
      'Servicios': [],
      'Docker': [],
      'Usuarios y Seguridad': [],
      'Otros': []
    };

    Object.entries(data).forEach(([command, output]: [string, any]) => {
      if (command.includes('uname') || command.includes('os-release') || command.includes('lscpu')) {
        categories['Sistema y Hardware'].push({ command, output });
      } else if (command.includes('free') || command.includes('df')) {
        categories['Memoria y Disco'].push({ command, output });
      } else if (command.includes('top') || command.includes('ps aux')) {
        categories['Procesos'].push({ command, output });
      } else if (command.includes('netstat') || command.includes('ss -') || command.includes('lsof') || command.includes('ip addr')) {
        categories['Red y Puertos'].push({ command, output });
      } else if (command.includes('systemctl')) {
        categories['Servicios'].push({ command, output });
      } else if (command.includes('docker')) {
        categories['Docker'].push({ command, output });
      } else if (command.includes('who') || command.includes('last')) {
        categories['Usuarios y Seguridad'].push({ command, output });
      } else {
        categories['Otros'].push({ command, output });
      }
    });

    return categories;
  };

  const generateSummary = () => {
    if (!results || !results.data) return '';

    let summary = `═══════════════════════════════════════════════════════════════\n`;
    summary += `   RESUMEN COMPLETO DEL SERVIDOR: ${results.host}\n`;
    summary += `   Fecha: ${new Date(results.timestamp).toLocaleString('es')}\n`;
    summary += `═══════════════════════════════════════════════════════════════\n\n`;

    const categories = categorizeResults(results.data);

    Object.entries(categories).forEach(([category, items]: [string, any]) => {
      if (items.length > 0) {
        summary += `\n┌─────────────────────────────────────────────────────────────┐\n`;
        summary += `│ ${category.toUpperCase().padEnd(58)} │\n`;
        summary += `└─────────────────────────────────────────────────────────────┘\n\n`;

        items.forEach((item: any) => {
          summary += `▶ ${item.command}\n`;
          summary += `${'─'.repeat(60)}\n`;
          summary += `${item.output}\n\n`;
        });
      }
    });

    return summary;
  };

  const downloadSummary = () => {
    const summary = generateSummary();
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-${results.host}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const copyToClipboard = () => {
    const summary = generateSummary();
    navigator.clipboard.writeText(summary);
    alert('📋 Resumen copiado al portapapeles');
  };

  // Función para parsear datos y crear dashboard bonito
  const parseDashboard = (data: any) => {
    if (!data) return null;

    const dashboard: any = {
      sistema: {},
      recursos: {},
      aplicaciones: [],
      puertos: [],
      servicios: [],
      seguridad: {}
    };

    // Parsear uptime
    const uptimeMatch = data['uptime']?.match(/up (\d+) days?/);
    if (uptimeMatch) {
      dashboard.sistema.diasEncendido = parseInt(uptimeMatch[1]);
    }

    // Parsear memoria
    const memMatch = data['free -h']?.match(/Mem:\s+(\S+)\s+(\S+)\s+(\S+)/);
    if (memMatch) {
      dashboard.recursos.memoriaTotal = memMatch[1];
      dashboard.recursos.memoriaUsada = memMatch[2];
      dashboard.recursos.memoriaLibre = memMatch[3];
    }

    // Parsear disco
    const diskMatch = data['df -h']?.match(/\/dev\/sda1\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)%/);
    if (diskMatch) {
      dashboard.recursos.discoTotal = diskMatch[1];
      dashboard.recursos.discoUsado = diskMatch[2];
      dashboard.recursos.discoLibre = diskMatch[3];
      dashboard.recursos.discoPorcentaje = parseInt(diskMatch[4]);
    }

    // Parsear CPU
    const cpuMatch = data['lscpu | head -n 20']?.match(/CPU\(s\):\s+(\d+)/);
    if (cpuMatch) {
      dashboard.recursos.cpuCores = parseInt(cpuMatch[1]);
    }

    // Parsear OS
    const osMatch = data['cat /etc/os-release']?.match(/PRETTY_NAME="([^"]+)"/);
    if (osMatch) {
      dashboard.sistema.os = osMatch[1];
    }

    // Detectar aplicaciones de lsof
    const lsofData = data['lsof -i -P -n | grep LISTEN | head -n 20'];
    if (lsofData) {
      const apps: any = {};
      const lines = lsofData.split('\n');
      lines.forEach((line: string) => {
        const match = line.match(/(\S+)\s+\d+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\*:(\d+)/);
        if (match) {
          const [, app, port] = match;
          const appName = app.toLowerCase();
          
          let displayName = app;
          let icon = '🔧';
          let tipo = 'Aplicación';

          if (appName.includes('mysql')) { displayName = 'MySQL'; icon = '🗄️'; tipo = 'Base de Datos'; }
          else if (appName.includes('nginx')) { displayName = 'Nginx'; icon = '🌐'; tipo = 'Servidor Web'; }
          else if (appName.includes('apache')) { displayName = 'Apache'; icon = '🌐'; tipo = 'Servidor Web'; }
          else if (appName.includes('redis')) { displayName = 'Redis'; icon = '⚡'; tipo = 'Caché'; }
          else if (appName.includes('gunicorn')) { displayName = 'Gunicorn'; icon = '🐍'; tipo = 'Servidor Python'; }
          else if (appName.includes('python')) { displayName = 'Python App'; icon = '🐍'; tipo = 'Aplicación Python'; }
          else if (appName.includes('node') || appName.includes('next')) { displayName = 'Next.js'; icon = '⚛️'; tipo = 'Servidor Node.js'; }
          else if (appName.includes('sshd')) { displayName = 'SSH'; icon = '🔐'; tipo = 'Acceso Remoto'; }
          else if (appName.includes('frps')) { displayName = 'FRP Server'; icon = '🔀'; tipo = 'Proxy/Túnel'; }
          else if (appName.includes('systemd')) { displayName = 'Systemd'; icon = '⚙️'; tipo = 'Sistema'; }

          if (!apps[displayName]) {
            apps[displayName] = { nombre: displayName, icon, tipo, puertos: [] };
          }
          apps[displayName].puertos.push(port);
        }
      });
      dashboard.aplicaciones = Object.values(apps);
    }

    // Detectar servicios activos
    const serviciosData = data['systemctl list-units --type=service --state=running | head -n 20'];
    if (serviciosData) {
      const lines = serviciosData.split('\n');
      lines.forEach((line: string) => {
        if (line.includes('.service') && line.includes('loaded active running')) {
          const match = line.match(/(\S+\.service)\s+loaded\s+active\s+running\s+(.+)/);
          if (match) {
            dashboard.servicios.push({
              nombre: match[1].replace('.service', ''),
              descripcion: match[2]
            });
          }
        }
      });
    }

    // Info de usuarios
    const lastData = data['last -n 10'];
    if (lastData) {
      const lines = lastData.split('\n').filter((l: string) => l.trim() && !l.includes('wtmp'));
      dashboard.seguridad.ultimosAccesos = lines.length;
    }

    return dashboard;
  };

  const [showDashboard, setShowDashboard] = useState(false);
  const dashboard = results?.data ? parseDashboard(results.data) : null;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>🖥️ Monitor de Servidores</h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
        💾 Los servidores se guardan automáticamente en tu navegador
      </p>

      <div style={{ marginBottom: '40px', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>➕ Agregar Servidor</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Nombre del servidor"
            value={newServer.name}
            onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type="text"
            placeholder="Host/IP"
            value={newServer.host}
            onChange={(e) => setNewServer({ ...newServer, host: e.target.value })}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type="text"
            placeholder="Usuario"
            value={newServer.username}
            onChange={(e) => setNewServer({ ...newServer, username: e.target.value })}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={newServer.password}
            onChange={(e) => setNewServer({ ...newServer, password: e.target.value })}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type="number"
            placeholder="Puerto (default: 22)"
            value={newServer.port}
            onChange={(e) => setNewServer({ ...newServer, port: parseInt(e.target.value) || 22 })}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={addServer}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ➕ Agregar Servidor
          </button>
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showPassword ? '🙈 Ocultar' : '👁️ Mostrar'} Contraseña
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>📋 Mis Servidores ({servers.length})</h2>
        {servers.length === 0 ? (
          <p style={{ color: '#666' }}>No hay servidores configurados. Agrega uno arriba.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {servers.map((server, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong style={{ fontSize: '16px' }}>{server.name}</strong>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {server.username}@{server.host}:{server.port}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => checkServer(server)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      background: loading ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? '⏳ Revisando...' : '🔍 Revisar Completo'}
                  </button>
                  <button
                    onClick={() => removeServer(index)}
                    style={{
                      padding: '8px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {results && (
        <div style={{ background: results.status === 'error' ? '#fff3cd' : '#e8f5e9', padding: '20px', borderRadius: '8px', border: results.status === 'error' ? '2px solid #ffc107' : '2px solid #4caf50' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>
              {results.status === 'error' ? '❌ Error' : '✅ Resultados Completos'}
            </h2>
            {results.status !== 'error' && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowDashboard(!showDashboard)}
                  style={{
                    padding: '10px 20px',
                    background: showDashboard ? '#9c27b0' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {showDashboard ? '📊 Ver Detalles Técnicos' : '🎨 Ver Dashboard Visual'}
                </button>
                <button
                  onClick={downloadSummary}
                  style={{
                    padding: '10px 20px',
                    background: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  📥 Descargar Resumen
                </button>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '10px 20px',
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  📋 Copiar
                </button>
              </div>
            )}
          </div>
          
          {results.status === 'error' ? (
            <p style={{ color: '#721c24' }}>{results.error}</p>
          ) : (
            <div>
              <div style={{ background: 'white', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <p style={{ margin: '5px 0' }}><strong>🖥️ Servidor:</strong> {results.host}</p>
                <p style={{ margin: '5px 0' }}><strong>📅 Fecha:</strong> {new Date(results.timestamp).toLocaleString('es')}</p>
              </div>

              {showDashboard && dashboard ? (
                /* DASHBOARD VISUAL BONITO */
                <div>
                  {/* Información del Sistema */}
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#4caf50' }}>
                      💻 Información del Servidor
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      {dashboard.sistema.os && (
                        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Sistema Operativo</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{dashboard.sistema.os}</div>
                        </div>
                      )}
                      {dashboard.sistema.diasEncendido && (
                        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Tiempo Encendido</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{dashboard.sistema.diasEncendido} días</div>
                        </div>
                      )}
                      {dashboard.recursos.cpuCores && (
                        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Núcleos de CPU</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>{dashboard.recursos.cpuCores} cores</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recursos */}
                  {dashboard.recursos && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#ff9800' }}>
                        📊 Uso de Recursos
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                        {/* Memoria */}
                        {dashboard.recursos.memoriaTotal && (
                          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>💾 Memoria RAM</div>
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#666' }}>Usada: </span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f44336' }}>{dashboard.recursos.memoriaUsada}</span>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#666' }}>Libre: </span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>{dashboard.recursos.memoriaLibre}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '14px', color: '#666' }}>Total: </span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{dashboard.recursos.memoriaTotal}</span>
                            </div>
                          </div>
                        )}

                        {/* Disco */}
                        {dashboard.recursos.discoTotal && (
                          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>💿 Disco Duro</div>
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#666' }}>Usado: </span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f44336' }}>{dashboard.recursos.discoUsado}</span>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#666' }}>Libre: </span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>{dashboard.recursos.discoLibre}</span>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <span style={{ fontSize: '14px', color: '#666' }}>Total: </span>
                              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{dashboard.recursos.discoTotal}</span>
                            </div>
                            {/* Barra de progreso */}
                            <div style={{ background: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ 
                                background: dashboard.recursos.discoPorcentaje > 80 ? '#f44336' : dashboard.recursos.discoPorcentaje > 60 ? '#ff9800' : '#4caf50',
                                width: `${dashboard.recursos.discoPorcentaje}%`,
                                height: '100%'
                              }}></div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'right' }}>
                              {dashboard.recursos.discoPorcentaje}% usado
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Aplicaciones */}
                  {dashboard.aplicaciones && dashboard.aplicaciones.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#9c27b0' }}>
                        🚀 Aplicaciones Detectadas ({dashboard.aplicaciones.length})
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                        {dashboard.aplicaciones.map((app: any, idx: number) => (
                          <div key={idx} style={{ 
                            background: 'white', 
                            padding: '20px', 
                            borderRadius: '10px', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border: '2px solid #f0f0f0',
                            transition: 'transform 0.2s'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                              <span style={{ fontSize: '32px', marginRight: '10px' }}>{app.icon}</span>
                              <div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{app.nombre}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{app.tipo}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              <strong>Puertos:</strong> {app.puertos.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Servicios */}
                  {dashboard.servicios && dashboard.servicios.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#00bcd4' }}>
                        ⚙️ Servicios Activos ({dashboard.servicios.length})
                      </h3>
                      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                          {dashboard.servicios.slice(0, 12).map((servicio: any, idx: number) => (
                            <div key={idx} style={{ 
                              padding: '10px',
                              borderLeft: '3px solid #4caf50',
                              background: '#f9f9f9',
                              borderRadius: '4px'
                            }}>
                              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{servicio.nombre}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{servicio.descripcion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seguridad */}
                  {dashboard.seguridad && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#f44336' }}>
                        🔐 Información de Seguridad
                      </h3>
                      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {dashboard.seguridad.ultimosAccesos && (
                          <div>
                            <span style={{ fontSize: '14px', color: '#666' }}>Últimos accesos registrados: </span>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>{dashboard.seguridad.ultimosAccesos}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* VISTA TÉCNICA DETALLADA */
                results.data && (() => {
                  const categories = categorizeResults(results.data);
                  return Object.entries(categories).map(([category, items]: [string, any]) => {
                    if (items.length === 0) return null;
                    
                    return (
                      <div key={category} style={{ marginBottom: '30px' }}>
                        <h3 style={{ 
                          fontSize: '18px', 
                          marginBottom: '15px', 
                          color: '#1976d2',
                          borderBottom: '2px solid #1976d2',
                          paddingBottom: '8px'
                        }}>
                          📊 {category}
                        </h3>
                        {items.map((item: any, idx: number) => (
                          <div key={idx} style={{ marginBottom: '20px' }}>
                            <h4 style={{ 
                              fontSize: '14px', 
                              marginBottom: '8px', 
                              color: '#555',
                              background: '#f5f5f5',
                              padding: '8px 12px',
                              borderRadius: '4px',
                              fontFamily: 'monospace'
                            }}>
                              ▶ {item.command}
                            </h4>
                            <pre
                              style={{
                                background: '#1e1e1e',
                                color: '#d4d4d4',
                                padding: '15px',
                                borderRadius: '4px',
                                overflow: 'auto',
                                fontSize: '12px',
                                border: '1px solid #333',
                                maxHeight: '400px'
                              }}
                            >
                              {item.output}
                            </pre>
                          </div>
                        ))}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
