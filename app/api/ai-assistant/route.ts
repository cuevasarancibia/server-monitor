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

    // Extraer información clave de cada servidor
    const simplifiedData = serversData.map((server: any) => {
      const info: any = {
        nombre: server.name,
        host: server.host,
        aplicaciones: [],
        puertos: [],
        procesos: [],
        rutas: []
      };

      // Extraer de ps aux
      const psAux = server.data?.data?.['ps aux --sort=-%mem | head -n 10'] || '';
      const psLines = psAux.split('\n').filter((l: string) => l.trim());
      
      psLines.forEach((line: string) => {
        // Buscar rutas /var/www/, /app/, /home/
        const pathMatch = line.match(/\/(?:var\/www|app|home)\/([^\s]+)/g);
        if (pathMatch) {
          pathMatch.forEach((path: string) => {
            if (!info.rutas.includes(path)) {
              info.rutas.push(path);
              
              // Detectar aplicaciones por nombre de carpeta
              if (path.toLowerCase().includes('crm')) {
                info.aplicaciones.push(`CRM: ${path}`);
              }
              if (path.toLowerCase().includes('frontend')) {
                info.aplicaciones.push(`Frontend: ${path}`);
              }
              if (path.toLowerCase().includes('backend') || path.toLowerCase().includes('api')) {
                info.aplicaciones.push(`Backend/API: ${path}`);
              }
            }
          });
        }

        // Detectar aplicaciones por proceso
        if (line.includes('node') || line.includes('npm')) {
          info.procesos.push('Node.js/JavaScript');
        }
        if (line.includes('python') || line.includes('gunicorn') || line.includes('django')) {
          info.procesos.push('Python/Django');
        }
        if (line.includes('nginx')) {
          info.procesos.push('Nginx (Web Server)');
        }
        if (line.includes('mysql')) {
          info.procesos.push('MySQL (Base de datos)');
        }
        if (line.includes('postgres')) {
          info.procesos.push('PostgreSQL (Base de datos)');
        }
        if (line.includes('redis')) {
          info.procesos.push('Redis (Caché)');
        }
      });

      // Extraer puertos de lsof
      const lsof = server.data?.data?.['lsof -i -P -n | grep LISTEN | head -n 20'] || '';
      const lsofLines = lsof.split('\n').filter((l: string) => l.trim());
      
      lsofLines.forEach((line: string) => {
        const portMatch = line.match(/\*:(\d+)/);
        if (portMatch) {
          const port = portMatch[1];
          let app = 'Desconocido';
          
          if (line.includes('nginx')) app = 'Nginx';
          if (line.includes('node')) app = 'Node.js';
          if (line.includes('python')) app = 'Python';
          if (line.includes('mysql')) app = 'MySQL';
          if (line.includes('postgres')) app = 'PostgreSQL';
          if (line.includes('redis')) app = 'Redis';
          
          info.puertos.push(`Puerto ${port}: ${app}`);
        }
      });

      // Eliminar duplicados
      info.procesos = [...new Set(info.procesos)];
      info.aplicaciones = [...new Set(info.aplicaciones)];

      return info;
    });

    // Construir prompt mejorado
    const prompt = `Eres un asistente técnico. Responde MÁXIMO 5 líneas, directo al grano.

🔍 PREGUNTA: ${question}

📊 SERVIDORES DISPONIBLES:
${simplifiedData.map((s: any, idx: number) => `
${idx + 1}. ${s.nombre} (${s.host})
   Aplicaciones: ${s.aplicaciones.length > 0 ? s.aplicaciones.join(', ') : 'Ninguna detectada'}
   Rutas: ${s.rutas.slice(0, 5).join(', ') || 'Ninguna'}
   Procesos: ${s.procesos.join(', ') || 'Ninguno'}
   Puertos: ${s.puertos.slice(0, 8).join(', ') || 'Ninguno'}
`).join('\n')}

💬 INSTRUCCIONES:
- Si encuentras lo que busca: Di qué servidor, qué aplicación, ruta y puerto
- Si NO encuentras: Di solo "❌ No encontrado"
- Usa emojis: ✅ ❌ 📂 🌐 ⚙️ 🗄️
- Máximo 5 líneas

RESPUESTA:`;

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
            temperature: 0.2,
            maxOutputTokens: 200,
            topP: 0.8,
            topK: 20
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
```

---

## 🎯 **QUÉ HACE ESTE CÓDIGO:**

1. **Extrae info clave ANTES** de pasársela a Gemini:
   - Busca rutas con `/var/www/`, `/app/`, `/home/`
   - Detecta si hay "crm", "frontend", "backend" en las rutas
   - Identifica aplicaciones por proceso (Node, Python, Nginx, etc)
   - Extrae puertos activos

2. **Le da datos PRE-PROCESADOS** en formato simple:
```
   1. srv1025138 (72.60.141.227)
      Aplicaciones: CRM: /var/www/crm-telecom/frontend, Backend/API: /var/www/crm-telecom/backend
      Puertos: Puerto 7350: Node.js, Puerto 7351: Node.js, Puerto 5432: PostgreSQL
