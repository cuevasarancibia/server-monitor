# 🖥️ Monitor de Servidores - Versión Completa

Aplicación web para revisar tus servidores bajo demanda con **información detallada completa**.

## 📋 Características Principales

- ✅ **Revisar servidores cuando lo necesites** (no monitoreo constante)
- 💾 **Servidores guardados automáticamente** en tu navegador (no necesitas agregarlos cada vez)
- 🔐 Conexión segura por SSH
- 📊 **Información completa y detallada**:
  - Estado del sistema (uptime, CPU, memoria, disco)
  - **Puertos abiertos y ocupados** (netstat, ss, lsof)
  - **Conexiones activas** y en escucha
  - Procesos activos (ordenados por CPU y memoria)
  - **Servicios en ejecución** (systemctl)
  - Usuarios conectados y últimos logins
  - Interfaces de red y configuración
  - Información de hardware (CPU, OS)
  - **Contenedores Docker** (si está instalado)
- 📥 **Generar resumen completo** descargable o copiable
- 🌐 Interfaz web organizada por categorías
- ☁️ Desplegable en Vercel (gratis)

## 🎯 Qué Aparece en la Aplicación

### Panel Principal
1. **Sección "Agregar Servidor"**: Formulario para agregar nuevos servidores
2. **Lista "Mis Servidores"**: Todos tus servidores guardados con botones para revisar o eliminar
3. **Panel de Resultados**: Información completa organizada en categorías

### Información Detallada que Verás

Cuando haces click en "🔍 Revisar Completo", verás:

#### 📊 Sistema y Hardware
- Información del sistema operativo (uname, versión de Linux)
- Información detallada de CPU (núcleos, arquitectura, etc.)
- Tiempo encendido (uptime)

#### 💾 Memoria y Disco
- Uso de memoria RAM (libre, usado, disponible)
- Uso de disco en todas las particiones
- Espacio disponible y porcentajes

#### 🔄 Procesos
- Procesos activos con uso de recursos
- Top 10 procesos por uso de memoria
- Top 10 procesos por uso de CPU

#### 🌐 Red y Puertos
- **Puertos abiertos y en escucha** (TCP/UDP)
- **Conexiones activas** (establecidas, escuchando)
- **Aplicaciones usando puertos** específicos
- Interfaces de red con IPs asignadas
- Estado de conexiones de red

#### ⚙️ Servicios
- Servicios activos y corriendo (systemctl)
- Estado de cada servicio

#### 🐳 Docker (si está instalado)
- Contenedores corriendo
- Uso de recursos de contenedores
- Estado de cada contenedor

#### 👥 Usuarios y Seguridad
- Usuarios actualmente conectados
- Últimos 10 logins al sistema
- Sesiones activas

### Funciones Adicionales
- **📥 Descargar Resumen**: Descarga un archivo .txt con toda la información
- **📋 Copiar**: Copia todo el resumen al portapapeles
- **Organización por categorías**: Información agrupada lógicamente

## 🚀 Instalación Local

1. **Clonar o descargar este proyecto**

2. **Instalar dependencias:**
```bash
npm install
```

3. **Ejecutar en modo desarrollo:**
```bash
npm run dev
```

4. **Abrir en el navegador:**
```
http://localhost:3000
```

## 📦 Desplegar en Vercel

### Opción 1: Desde GitHub

1. **Sube el proyecto a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/server-monitor.git
git push -u origin main
```

2. **Ve a [Vercel](https://vercel.com)**
   - Inicia sesión con tu cuenta de GitHub
   - Click en "Add New Project"
   - Importa tu repositorio
   - Click en "Deploy"

### Opción 2: Desde la CLI de Vercel

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Desplegar:**
```bash
vercel
```

3. **Seguir las instrucciones en pantalla**

## 🎯 Cómo Usar

1. **Agregar un servidor:**
   - Ingresa el nombre del servidor
   - Ingresa el host/IP
   - Ingresa el usuario SSH
   - Ingresa la contraseña SSH
   - Ingresa el puerto (por defecto 22)
   - Click en "Agregar Servidor"

2. **Revisar un servidor:**
   - Click en "🔍 Revisar" del servidor que quieras verificar
   - Espera unos segundos mientras se conecta
   - Verás los resultados en pantalla

3. **Información que verás:**
   - Uptime del servidor
   - Uso de memoria RAM
   - Uso de disco
   - Procesos activos

## 🔒 Seguridad

**IMPORTANTE:** 
- Las credenciales NO se guardan en ninguna base de datos
- Las credenciales solo existen en tu navegador (localStorage del navegador)
- Las conexiones SSH se hacen directamente desde el servidor de Vercel
- Nunca compartas tu URL de Vercel públicamente si contiene datos sensibles

### Recomendaciones de Seguridad:

1. **Usa una contraseña segura para proteger tu aplicación Vercel**
2. **Considera usar claves SSH en lugar de contraseñas**
3. **Limita los permisos del usuario SSH** (solo lectura si es posible)
4. **Usa autenticación en Vercel** para que solo tú puedas acceder

## 🛠️ Personalización

### Agregar más comandos a revisar

Edita el archivo `app/api/check-server/route.ts`:

```typescript
const commands = [
  'uptime',
  'free -h',
  'df -h /',
  'top -bn1 | head -n 20',
  // Agrega tus comandos aquí:
  'docker ps',  // Ver contenedores Docker
  'systemctl status nginx',  // Ver estado de servicios
  'tail -n 50 /var/log/syslog',  // Ver logs
];
```

## ⚠️ Limitaciones

- Solo funciona con servidores Linux/Unix
- Requiere acceso SSH
- Los servidores deben ser accesibles desde Internet (o donde esté desplegado Vercel)
- Vercel tiene límites de tiempo de ejecución (10 segundos para hobby plan)

## 🐛 Solución de Problemas

### Error: "Error al conectar con el servidor"
- Verifica que el host/IP sea correcto
- Verifica que el usuario y contraseña sean correctos
- Verifica que el puerto SSH sea el correcto
- Asegúrate de que el servidor sea accesible desde Internet

### Error: "Timeout"
- El servidor puede estar bloqueando las conexiones desde Vercel
- Verifica el firewall del servidor
- Verifica que el servicio SSH esté corriendo

## 📝 Notas

- Las credenciales se almacenan solo en tu navegador
- No hay monitoreo constante, solo revisas cuando lo solicitas
- Los resultados no se guardan, son solo para visualización inmediata

## 📄 Licencia

Uso libre para proyectos personales y comerciales.
