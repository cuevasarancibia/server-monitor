import { NextResponse } from 'next/server';

// Marcar esta ruta como solo servidor (Node.js runtime)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { host, username, password, port = 22 } = await request.json();

    if (!host || !username || !password) {
      return NextResponse.json(
        { error: 'Faltan credenciales requeridas' },
        { status: 400 }
      );
    }

    const result = await checkServer(host, username, password, port);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al conectar con el servidor' },
      { status: 500 }
    );
  }
}

function checkServer(
  host: string,
  username: string,
  password: string,
  port: number
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    // Importar ssh2 dinámicamente solo en el servidor
    const { Client } = await import('ssh2');
    const conn = new Client();
    const commands = [
      'uptime',                              // Tiempo encendido
      'free -h',                             // Memoria RAM
      'df -h',                               // Espacio en disco
      'top -bn1 | head -n 20',               // Procesos
      'netstat -tuln | head -n 30',          // Puertos abiertos
      'ss -tunap | head -n 30',              // Conexiones activas
      'ps aux --sort=-%mem | head -n 10',    // Top procesos por memoria
      'ps aux --sort=-%cpu | head -n 10',    // Top procesos por CPU
      'who',                                 // Usuarios conectados
      'last -n 10',                          // Últimos logins
      'systemctl list-units --type=service --state=running | head -n 20', // Servicios activos
      'lsof -i -P -n | grep LISTEN | head -n 20', // Puertos en escucha
      'uname -a',                            // Info del sistema
      'cat /etc/os-release',                 // Versión del OS
      'lscpu | head -n 20',                  // Info CPU
      'ip addr show',                        // Interfaces de red
      'docker ps 2>/dev/null || echo "Docker no instalado"',  // Contenedores Docker
      'docker stats --no-stream 2>/dev/null || echo "Docker no instalado"', // Stats Docker
    ];

    let results: any = {
      host,
      timestamp: new Date().toISOString(),
      status: 'connected',
      data: {},
    };

    conn
      .on('ready', () => {
        executeCommands(conn, commands, results)
          .then(() => {
            conn.end();
            resolve(results);
          })
          .catch((err) => {
            conn.end();
            reject(err);
          });
      })
      .on('error', (err) => {
        results.status = 'error';
        results.error = err.message;
        reject(results);
      })
      .connect({
        host,
        port,
        username,
        password,
        readyTimeout: 10000,
      });
  });
}

async function executeCommands(
  conn: any,
  commands: string[],
  results: any
): Promise<void> {
  for (const command of commands) {
    try {
      const output = await executeCommand(conn, command);
      results.data[command] = output;
    } catch (error: any) {
      results.data[command] = `Error: ${error.message}`;
    }
  }
}

function executeCommand(conn: any, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err: Error, stream: any) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';
      let errorOutput = '';

      stream
        .on('close', () => {
          if (errorOutput) {
            reject(new Error(errorOutput));
          } else {
            resolve(output);
          }
        })
        .on('data', (data: Buffer) => {
          output += data.toString();
        })
        .stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
    });
  });
}
