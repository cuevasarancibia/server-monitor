import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const servers = [];
    
    // Cargar servidores desde variables de entorno
    for (let i = 1; i <= 4; i++) {
      const serverEnv = process.env[`SERVER_${i}`];
      if (serverEnv) {
        try {
          const server = JSON.parse(serverEnv);
          servers.push(server);
        } catch (e) {
          console.error(`Error parsing SERVER_${i}:`, e);
        }
      }
    }
    
    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Error loading servers:', error);
    return NextResponse.json({ servers: [] });
  }
}
