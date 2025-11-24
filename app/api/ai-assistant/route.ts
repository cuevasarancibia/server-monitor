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

    // Convertir TODA la info a texto plano - IGUAL que lo que ves en pantalla
    let todaLaInfo = '';
    
    serversData.forEach((server: any) => {
      todaLaInfo += `\n${'='.repeat(70)}\n`;
      todaLaInfo += `SERVIDOR: ${server.name} (${server.host})\n`;
      todaLaInfo += `${'='.repeat(70)}\n\n`;
      
      // Obtener TODOS los comandos y sus salidas
      const comandos = server.data?.data || {};
      
      Object.entries(comandos).forEach(([comando, salida]: [string, any]) => {
        todaLaInfo += `▶ ${comando}\n`;
        todaLaInfo += `${'-'.repeat(70)}\n`;
        todaLaInfo += `${salida}\n\n`;
      });
    });

    // Prompt SUPER simple
    const prompt = `Analiza esta información COMPLETA de ${serversData.length} servidores Linux.

PREGUNTA: ${question}

DATOS COMPLETOS DE LOS SERVIDORES:
${todaLaInfo}

INSTRUCCIONES:
- Lee TODA la información arriba
- Busca lo que el usuario pregunta en TODOS los comandos y salidas
- Si lo encuentras: Di en qué servidor está, la ruta exacta, puerto, y proceso
- Si NO lo encuentras: Di "❌ No encontrado"
- Responde en máximo 6 líneas
- Usa emojis: ✅ ❌ 📂 🔌 🐍 🌐

RESPUESTA:`;

    // Llamar a Gemini
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
            maxOutputTokens: 400,
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
