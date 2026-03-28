# CasaControl

Aplicación web para gestionar facturas del hogar con integración de Inteligencia Artificial.

## Características

- **Autenticación**: Registro e inicio de sesión con JWT
- **Gestión de facturas**: CRUD completo con categorías
- **Dashboard**: Gráficos y estadísticas de gastos
- **Multiusuario**: Hogares compartidos con código de invitación
- **IA integrada**: 
  - Chat conversacional (Groq - gratuito)
  - Escaneo de facturas con visión (OpenAI)
  - Análisis automático de gastos
  - Recomendaciones personalizadas
  - Predicción de gastos futuros

## Tecnologías

- **Frontend**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS
- **Backend**: API Routes de Next.js
- **Base de datos**: PostgreSQL (Neon/Render)
- **Autenticación**: JWT (cookies httpOnly)
- **IA**: Groq (chat) + OpenAI (visión)

## Requisitos

- Node.js 18+
- PostgreSQL
- API keys de IA (Groq + OpenAI)

## Instalación

1. **Clonar el proyecto**
```bash
git clone <repo-url>
cd CasaControl
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="tu-secret-muy-segura"
GROQ_API_KEY="tu-groq-api-key"
OPENAI_API_KEY="tu-openai-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Configurar base de datos**
```bash
npm run db:generate
npm run db:push
```

5. **Iniciar el servidor**
```bash
npm run dev
```

6. **Acceder a la app**
Abre http://localhost:3000

## Estructura del Proyecto

```
CasaControl/
├── app/
│   ├── api/              # API Routes
│   │   ├── ai/          # Chat e Insights
│   │   ├── auth/        # Autenticación
│   │   ├── bills/       # Facturas
│   │   ├── categories/  # Categorías
│   │   ├── dashboard/   # Estadísticas
│   │   ├── households/  # Hogares
│   │   └── user/       # Usuario
│   ├── bills/           # Página de facturas
│   ├── chat/            # Chat con IA
│   ├── dashboard/       # Dashboard principal
│   ├── profile/        # Perfil de usuario
│   ├── login/           # Login
│   ├── register/        # Registro
│   └── onboarding/      # Configuración de hogar
├── components/
│   ├── ui/              # Componentes UI
│   └── Navigation.tsx   # Navegación
├── lib/
│   ├── ai.ts            # Funciones de IA
│   ├── auth.ts          # Utilidades de auth
│   ├── prisma.ts        # Cliente Prisma
│   ├── store.ts         # Estado global (Zustand)
│   └── validations.ts   # Esquemas Zod
└── prisma/
    └── schema.prisma    # Esquema de base de datos
```

## API Keys

### Groq (Chat - Gratis)
1. Ve a https://console.groq.com
2. Crea una cuenta
3. Genera tu API Key
4. Añádela a `.env`

### OpenAI (Escaneo de facturas)
1. Ve a https://platform.openai.com
2. Crea una cuenta
3. Genera API Key en API Keys
4. Añádela a `.env`

**Nota:** Groq es gratuito para texto. OpenAI tiene costo bajo con gpt-4o-mini.

## Despliegue en Vercel

1. Conecta tu repositorio GitHub a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Deploy automático desde main

Variables necesarias en Vercel:
- `DATABASE_URL`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Uso

### Registro
1. Crea una cuenta en `/register`
2. Se creará automáticamente un hogar

### Unirse a un hogar
1. El propietario comparte el código de invitación
2. Ve a `/onboarding` y selecciona "Unirse a hogar"

### Gestionar facturas
1. Ve a `/bills`
2. Click en "Nueva factura" para añadir
3. Escanea facturas con la cámara
4. Edita o elimina facturas existentes

### Chat con IA
1. Ve a `/chat`
2. Pregunta sobre tus gastos
3. Recibe recomendaciones personalizadas

### Perfil
1. Ve a `/profile`
2. Edita tu nombre o el nombre del hogar
3. Cierra sesión

## Licencia

MIT
