import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { question, serversData } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key no configurada' },
        { status: 500 }
      );
    }

    // Función para generar el resumen completo (IGUAL que el .txt que descargas)
    const generateFullSummary = (serverData: any) => {
      let summary = `═══════════════════════════════════════════════════════════════\n`;
      summary += `   SERVIDOR: ${serverData.name} (${serverData.host})\n`;
      summary += `═══════════════════════════════════════════════════════════════\n\n`;

      const data = serverData.data?.data;
      if (!data) return summary + 'Sin datos\n';

      // Categorizar resultados
      const categories: any = {
        'SISTEMA Y HARDWARE': [],
        'MEMORIA Y DISCO': [],
        'DIRECTORIOS Y APLICACIONES': [],
        'PROCESOS': [],
        'RED Y PUERTOS': [],
        'SERVICIOS': [],
        'DOCKER': [],
        'USUARIOS Y SEGURIDAD': [],
        'OTROS': []
      };

      Object.entries(data).forEach(([command, output]: [string, any]) => {
        if (command.includes('uname') || command.includes('os-release') || command.includes('lscpu')) {
          categories['SISTEMA Y HARDWARE'].push({ command, output });
        } else if (command.includes('free') || command.includes('df')) {
          categories['MEMORIA Y DISCO'].push({ command, output });
        } else if (command.includes('ls -la') || command.includes('find')) {
          categories['DIRECTORIOS Y APLICACIONES'].push({ command, output });
        } else if (command.includes('top') || command.includes('ps aux')) {
          categories['PROCESOS'].push({ command, output });
        } else if (command.includes('netstat') || command.includes('ss -') || command.includes('lsof') || command.includes('ip addr')) {
          categories['RED Y PUERTOS'].push({ command, output });
        } else if (command.includes('systemctl')) {
          categories['SERVICIOS'].push({ command, output });
        } else if (command.includes('docker')) {
          categories['DOCKER'].push({ command, output });
        } else if (command.includes('who') || command.includes('last')) {
          categories['USUARIOS Y SEGURIDAD'].push({ command, output });
        } else {
          categories['OTROS'].push({ command, output });
        }
      });

      Object.entries(categories).forEach(([category, items]: [string, any]) => {
        if (items.length > 0) {
          summary += `\n┌─────────────────────────────────────────────────────────────┐\n`;
          summary += `│ ${category.padEnd(58)} │\n`;
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

    // Generar resumen completo de TODOS los servidores
    let resumenCompleto = '📊 ANÁLISIS DETALLADO DE TODOS LOS SERVIDORES:\n\n';
    
    serversData.forEach((server: any) => {
      resumenCompleto += generateFullSummary(server);
      resumenCompleto += '\n\n';
    });

    // Prompt optimizado
    const prompt = `Tienes acceso al análisis COMPLETO de ${serversData.length} servidores Linux.

Tu trabajo es responder la pregunta del usuario de forma DIRECTA y PRECISA.

REGLAS:
1. Lee CUIDADOSAMENTE todos los datos de los servidores
2. Busca en TODAS las secciones: directorios, procesos, puertos, servicios
3. Si encuentras lo que busca: Di el servidor, la ruta EXACTA, y puerto si aplica
4. Si NO encuentras: Di "❌ No encontrado"
5. Responde en máximo 6 líneas
6. Usa emojis: ✅ ❌ 📂 🌐 ⚙️ 🗄️

DATOS COMPLETOS:
${resumenCompleto}

PREGUNTA:
${question}

RESPUESTA DIRECTA:`;

    // Llamar a Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 300,
            topP: 0.9,
            topK: 10
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json({
        answer: data.candidates[0].content.parts[0].text
      });
    } else {
      return NextResponse.json(
        { error: 'No se pudo obtener respuesta de la IA' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la consulta' },
      { status: 500 }
    );
  }
}
