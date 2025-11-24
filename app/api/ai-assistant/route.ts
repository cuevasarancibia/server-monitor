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

    // Construir el prompt optimizado para respuestas cortas
    const prompt = `Eres un asistente técnico experto. Tu trabajo es responder DIRECTO y CONCISO (máximo 150 palabras).

📋 REGLAS ESTRICTAS:
1. Responde en máximo 4-5 líneas
2. Si encuentras lo que busca: di EXACTAMENTE dónde está (servidor, ruta, puerto)
3. Si NO encuentras: di solo "❌ No encontrado en ningún servidor"
4. NO des explicaciones técnicas largas
5. USA EMOJIS para mejor lectura (✅ ❌ 📂 🌐 ⚙️ 🗄️ 🐍 🟢)
6. Enfócate en: aplicaciones detectadas (nginx, node, python, redis, mysql, postgres), puertos ocupados, rutas /var/www/, procesos activos

📊 DATOS DE LOS SERVIDORES:
${JSON.stringify(serversData, null, 2)}

❓ PREGUNTA:
${question}

💬 RESPUESTA (CORTA Y DIRECTA):`;

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
            temperature: 0.3,
            maxOutputTokens: 300,
            topP: 0.8,
            topK: 40
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
