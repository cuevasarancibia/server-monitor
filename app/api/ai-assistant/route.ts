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

    // BÚSQUEDA EXHAUSTIVA EN CADA SERVIDOR
    const hallazgosPorServidor = serversData.map((server: any) => {
      const hallazgos: any = {
        servidor: server.name,
        host: server.host,
        aplicaciones: [],
        rutas: [],
        puertos: [],
        servicios: [],
        bases_datos: []
      };

      // Convertir TODO a string para buscar
      const todoElContenido = JSON.stringify(server.data, null, 2);

      // BUSCAR APLICACIONES POR RUTAS /var/www/, /app/, /home/
      const rutasMatch = todoElContenido.match(/\/(?:var\/www|app|home|usr\/local|opt)\/[^\s"',\]]+/g) || [];
      const rutasUnicas = [...new Set(rutasMatch)].filter(r => r.length > 10); // Filtrar rutas muy cortas
      
      rutasUnicas.forEach((ruta: string) => {
        const rutaLower = ruta.toLowerCase();
        
        // Detectar CRM
        if (rutaLower.includes('crm')) {
          hallazgos.aplicaciones.push(`🎯 CRM: ${ruta}`);
          hallazgos.rutas.push(ruta);
        }
        // Detectar Frontend
        else if (rutaLower.includes('frontend') || rutaLower.includes('client')) {
          hallazgos.aplicaciones.push(`🎨 Frontend: ${ruta}`);
          hallazgos.rutas.push(ruta);
        }
        // Detectar Backend/API
        else if (rutaLower.includes('backend') || rutaLower.includes('api') || rutaLower.includes('server')) {
          hallazgos.aplicaciones.push(`⚙️ Backend: ${ruta}`);
          hallazgos.rutas.push(ruta);
        }
        // Detectar WordPress
        else if (rutaLower.includes('wordpress') || rutaLower.includes('wp-content')) {
          hallazgos.aplicaciones.push(`📝 WordPress: ${ruta}`);
          hallazgos.rutas.push(ruta);
        }
        // Detectar E-commerce
        else if (rutaLower.includes('shop') || rutaLower.includes('ecommerce') || rutaLower.includes('tienda')) {
          hallazgos.aplicaciones.push(`🛒 E-commerce: ${ruta}`);
          hallazgos.rutas.push(ruta);
        }
        // Detectar Admin/Dashboard
        else if (rutaLower.includes('admin') || rutaLower.includes('dashboard') || rutaLower.includes('panel')) {
          hallazgos.aplicaciones.push(`👤 Panel Admin: ${ruta}`);
          hallazgos.rutas.push(ruta);
        }
        // Otras rutas de proyectos
        else if (rutaLower.match(/\/(var\/www|app|home)\/[a-z0-9_-]+\//)) {
          hallazgos.rutas.push(ruta);
        }
      });

      // BUSCAR PUERTOS ACTIVOS
      const lsofData = server.data?.data?.['lsof -i -P -n | grep LISTEN | head -n 20'] || '';
      const netstatData = server.data?.data?.['netstat -tuln | head -n 30'] || '';
      const ssData = server.data?.data?.['ss -tunap | head -n 30'] || '';
      
      const todosLosPuertos = `${lsofData}\n${netstatData}\n${ssData}`;
      const puertosMatch = todosLosPuertos.match(/[:\s](\d{2,5})(?:\s|$|\()/g) || [];
      const puertosUnicos = [...new Set(puertosMatch.map(p => p.match(/\d{2,5}/)?.[0]).filter(Boolean))];
      
      puertosUnicos.forEach((puerto: string) => {
        const puertoNum = parseInt(puerto);
        let tipo = 'Aplicación';
        
        if (puertoNum === 80 || puertoNum === 8080) tipo = '🌐 HTTP';
        else if (puertoNum === 443 || puertoNum === 8443) tipo = '🔒 HTTPS';
        else if (puertoNum === 22) tipo = '🔐 SSH';
        else if (puertoNum === 3306) tipo = '🗄️ MySQL';
        else if (puertoNum === 5432) tipo = '🐘 PostgreSQL';
        else if (puertoNum === 6379) tipo = '⚡ Redis';
        else if (puertoNum === 27017) tipo = '🍃 MongoDB';
        else if (puertoNum >= 3000 && puertoNum <= 9999) tipo = '🔌 App Web';
        
        hallazgos.puertos.push(`Puerto ${puerto}: ${tipo}`);
      });

      // BUSCAR SERVICIOS ACTIVOS
      const serviciosData = server.data?.data?.['systemctl list-units --type=service --state=running | head -n 20'] || '';
      const psData = server.data?.data?.['ps aux --sort=-%mem | head -n 10'] || '';
      
      if (serviciosData.includes('nginx') || psData.toLowerCase().includes('nginx')) {
        hallazgos.servicios.push('🌐 Nginx');
      }
      if (serviciosData.includes('apache') || psData.toLowerCase().includes('apache')) {
        hallazgos.servicios.push('🌐 Apache');
      }
      if (serviciosData.includes('mysql') || psData.toLowerCase().includes('mysql')) {
        hallazgos.bases_datos.push('🗄️ MySQL');
      }
      if (serviciosData.includes('postgres') || psData.toLowerCase().includes('postgres')) {
        hallazgos.bases_datos.push('🐘 PostgreSQL');
      }
      if (serviciosData.includes('redis') || psData.toLowerCase().includes('redis')) {
        hallazgos.bases_datos.push('⚡ Redis');
      }
      if (serviciosData.includes('mongodb') || psData.toLowerCase().includes('mongo')) {
        hallazgos.bases_datos.push('🍃 MongoDB');
      }
      if (serviciosData.includes('docker') || psData.toLowerCase().includes('docker')) {
        hallazgos.servicios.push('🐳 Docker');
      }

      // BUSCAR PROCESOS NODE/PYTHON
      if (psData.toLowerCase().includes('node') || psData.toLowerCase().includes('npm')) {
        hallazgos.servicios.push('⚛️ Node.js');
      }
      if (psData.toLowerCase().includes('python') || psData.toLowerCase().includes('gunicorn') || psData.toLowerCase().includes('django')) {
        hallazgos.servicios.push('🐍 Python');
      }

      return hallazgos;
    });

    // CREAR RESUMEN SUPER CLARO PARA GEMINI
    let resumenCompleto = '📊 ANÁLISIS COMPLETO DE SERVIDORES:\n\n';
    
    hallazgosPorServidor.forEach((h: any, idx: number) => {
      resumenCompleto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      resumenCompleto += `${idx + 1}. SERVIDOR: ${h.servidor} (${h.host})\n`;
      resumenCompleto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (h.aplicaciones.length > 0) {
        resumenCompleto += `📱 APLICACIONES ENCONTRADAS:\n`;
        h.aplicaciones.forEach((app: string) => resumenCompleto += `   ${app}\n`);
        resumenCompleto += `\n`;
      }
      
      if (h.rutas.length > 0 && h.aplicaciones.length === 0) {
        resumenCompleto += `📂 RUTAS DE PROYECTOS:\n`;
        h.rutas.slice(0, 10).forEach((ruta: string) => resumenCompleto += `   ${ruta}\n`);
        resumenCompleto += `\n`;
      }
      
      if (h.servicios.length > 0) {
        resumenCompleto += `⚙️ SERVICIOS: ${h.servicios.join(', ')}\n\n`;
      }
      
      if (h.bases_datos.length > 0) {
        resumenCompleto += `🗄️ BASES DE DATOS: ${h.bases_datos.join(', ')}\n\n`;
      }
      
      if (h.puertos.length > 0) {
        resumenCompleto += `🔌 PUERTOS ACTIVOS:\n`;
        h.puertos.slice(0, 10).forEach((puerto: string) => resumenCompleto += `   ${puerto}\n`);
        resumenCompleto += `\n`;
      }
      
      if (h.aplicaciones.length === 0 && h.rutas.length === 0) {
        resumenCompleto += `ℹ️ Sin aplicaciones específicas detectadas\n\n`;
      }
      
      resumenCompleto += `\n`;
    });

    // PROMPT SUPER SIMPLE PARA GEMINI
    const prompt = `${resumenCompleto}

❓ PREGUNTA DEL USUARIO:
${question}

💬 INSTRUCCIONES:
- Lee el análisis de arriba
- Si encontraste lo que busca: Di en qué servidor está, la ruta exacta y puerto
- Si NO lo encontraste: Di "❌ No encontrado en ningún servidor"
- Responde en máximo 5 líneas
- Usa emojis

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
            temperature: 0.1,
            maxOutputTokens: 200,
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
```

---

## 🎯 **ESTE CÓDIGO:**

1. **Busca EXHAUSTIVAMENTE** en cada servidor:
   - Rutas con `/var/www/`, `/app/`, `/home/`
   - Detecta "crm", "frontend", "backend", etc.
   - Extrae TODOS los puertos
   - Identifica servicios y bases de datos

2. **Le da a Gemini un resumen SUPER CLARO** tipo:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SERVIDOR: srv1025138 (72.60.141.227)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 APLICACIONES ENCONTRADAS:
   🎯 CRM: /var/www/crm-telecom/frontend
   🎯 CRM: /var/www/crm-telecom/backend

⚙️ SERVICIOS: 🌐 Nginx, ⚛️ Node.js, 🐳 Docker

🗄️ BASES DE DATOS: 🐘 PostgreSQL, ⚡ Redis

🔌 PUERTOS ACTIVOS:
   Puerto 7350: 🔌 App Web
   Puerto 7351: 🔌 App Web
   Puerto 5432: 🐘 PostgreSQL
