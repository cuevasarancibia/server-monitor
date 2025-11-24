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

    // Extraer TODO el contenido como texto plano
    const simplifiedData = serversData.map((server: any) => {
      const info: any = {
        nombre: server.name,
        host: server.host,
        hallazgos: []
      };

      // Convertir TODO el objeto de datos a string
      const allDataString = JSON.stringify(server.data, null, 2).toLowerCase();
      
      // Buscar aplicaciones CRM
      if (allDataString.includes('crm')) {
        const crmMatches = allDataString.match(/\/[^\s"']+crm[^\s"']*/gi) || [];
        crmMatches.forEach((match: string) => {
          if (!info.hallazgos.some((h: string) => h.includes(match))) {
            info.hallazgos.push(`📂 CRM encontrado: ${match}`);
          }
        });
      }

      // Buscar otras aplicaciones comunes
      const patterns = [
        { keyword: 'frontend', emoji: '🎨', name: 'Frontend' },
        { keyword: 'backend', emoji: '⚙️', name: 'Backend' },
        { keyword: 'api', emoji: '🔌', name: 'API' },
        { keyword: 'admin', emoji: '👤', name: 'Panel Admin' },
        { keyword: 'dashboard', emoji: '📊', name: 'Dashboard' },
        { keyword: 'shop', emoji: '🛒', name: 'Tienda' },
        { keyword: 'ecommerce', emoji: '🛍️', name: 'E-commerce' },
        { keyword: 'wordpress', emoji: '📝', name: 'WordPress' },
      ];

      patterns.forEach(({ keyword, emoji, name }) => {
        if (allDataString.includes(keyword)) {
          const matches = allDataString.match(new RegExp(`/[^\\s"']+${keyword}[^\\s"']*`, 'gi')) || [];
          matches.slice(0, 2).forEach((match: string) => {
            if (!info.hallazgos.some((h: string) => h.includes(match))) {
              info.hallazgos.push(`${emoji} ${name}: ${match}`);
            }
          });
        }
      });

      // Extraer puertos activos
      const portMatches = allDataString.match(/:\d{2,5}\s/g) || [];
      const uniquePorts = [...new Set(portMatches)].slice(0, 8);
      if (uniquePorts.length > 0) {
        info.hallazgos.push(`🔌 Puertos: ${uniquePorts.map(p => p.trim()).join(', ')}`);
      }

      // Si no encontró nada específico, poner un resumen genérico
      if (info.hallazgos.length === 0) {
        if (allDataString.includes('nginx')) info.hallazgos.push('🌐 Nginx detectado');
        if (allDataString.includes('mysql')) info.hallazgos.push('🗄️ MySQL detectado');
        if (allDataString.includes('postgres')) info.hallazgos.push('🗄️ PostgreSQL detectado');
        if (allDataString.includes('redis')) info.hallazgos.push('⚡ Redis detectado');
        if (allDataString.includes('docker')) info.hallazgos.push('🐳 Docker activo');
      }

      return info;
    });

    // Construir prompt SUPER SIMPLE
    const dataResumen = simplifiedData.map((s: any, idx: number) => 
      `${idx + 1}. **${s.nombre}** (${s.host})\n${s.hallazgos.join('\n') || '   Sin aplicaciones detectadas'}`
    ).join('\n\n');

    const prompt = `Pregunta: ${question}

Datos encontrados:
${dataResumen}

Responde en MÁXIMO 4 LÍNEAS. Si encontraste lo que busca el usuario, di en qué servidor está y qué rutas/puertos. Si no, di "❌ No encontrado".`;

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
            maxOutputTokens: 150,
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

## 🎯 **QUÉ HACE DIFERENTE:**

1. **Convierte TODO a texto** y busca directamente las palabras clave
2. **Busca "crm" en TODO el JSON** sin importar en qué campo esté
3. **Extrae las rutas** que contengan "crm" con regex
4. **Le da los datos YA PROCESADOS** a Gemini en formato super simple:
```
1. **srv1025138** (72.60.141.227)
📂 CRM encontrado: /var/www/crm-telecom/frontend
📂 CRM encontrado: /var/www/crm-telecom/backend
🔌 Puertos: :7350, :7351, :5432
