# GeoDex Mobile

Aplicación móvil desarrollada con React Native y Expo para la identificación, catalogación y aprendizaje de rocas. La app está orientada a ayudar a usuarios a explorar una colección de minerales y rocas, visualizar detalles, seguir su progreso y acceder a una experiencia de reconocimiento visual.

## Descripción

GeoDex Mobile combina una interfaz de usuario amigable con funcionalidades de:

- Reconocimiento y visualización de rocas
- Catálogo con información detallada por tipo de roca
- Colección personal del usuario
- Seguimiento de progreso académico o de aprendizaje
- Autenticación de acceso
- Vista administrativa

## Stack tecnológico

- React Native
- Expo SDK 58
- React Navigation
- AsyncStorage
- Expo Image Picker
- JavaScript

## Requisitos previos

Antes de ejecutar la app necesitas tener instalado:

- Node.js (versión recomendada LTS)
- npm o bun
- Expo CLI (se puede usar vía `npx`)
- Android Studio o Xcode para emulación nativa (opcional)

## Instalación

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd Frontend-Aplicaci-n-Reconocimiento-de-Rocas
```

2. Instala las dependencias:

```bash
npm install
```

Si prefieres usar Expo para resolver dependencias compatibles con la versión del SDK, también puedes ejecutar:

```bash
npx expo install
```

## Ejecución

Inicia la aplicación con:

```bash
npm start
```

O directamente:

```bash
npx expo start
```

### Ejecutar en plataformas

```bash
npx expo start --android
npx expo start --ios
npx expo start --web
```

## Estructura del proyecto

```text
.
├── App.js
├── app.json
├── index.js
├── package.json
├── README.md
├── assets/
│   ├── blocks/
│   ├── icon.png
│   ├── favicon.png
│   └── android-*
├── src/
│   ├── api/
│   │   ├── apiClient.js
│   │   └── services.js
│   ├── components/
│   │   └── UI.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── screens/
│   │   ├── HomeDashboardScreen.js
│   │   ├── SplashScreen.js
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── collection/
│   │   ├── progress/
│   │   └── recognition/
│   ├── theme/
│   │   └── theme.js
│   └── utils/
│       └── rockImages.js
```

## Funcionalidades principales

### 1. Autenticación
- Pantallas de bienvenida, inicio de sesión y registro
- Estado global del usuario gestionado con contexto de autenticación

### 2. Catálogo de rocas
- Visualización de información relacionada con diferentes tipos de roca
- Detalle de cada roca con atributos y contenido visual

### 3. Colección
- Gestión de elementos guardados por el usuario
- Organización de material reconocido o consultado

### 4. Progreso
- Seguimiento del avance o aprendizaje del usuario

### 5. Reconocimiento
- Flujo orientado a reconocer o identificar elementos del dominio geológico

### 6. Administración
- Pantalla dedicada para gestión o control del contenido y operaciones internas

## Variables de entorno y configuración

Actualmente el proyecto no requiere variables de entorno para ejecutarse localmente. Si en el futuro agregas servicios remotos, puedes crear un archivo `.env` y documentar las claves necesarias.

## Desarrollo recomendado

Para mantener el proyecto ordenado:

- Mantén la lógica de negocio en `src/api` y `src/utils`
- Usa `src/screens` para pantallas y `src/components` para UI reutilizable
- Centraliza la configuración visual en `src/theme` y los estados de autenticación en `src/context`

## Scripts disponibles

En `package.json` se incluyen los siguientes scripts:

```bash
npm start
npm run android
npm run ios
npm run web
```

## Solución de problemas comunes

### Error de dependencias

```bash
rm -rf node_modules package-lock.json
npm install
```

### Problemas con Metro o caché

```bash
npx expo start --clear
```

### Error de compilación nativa

Asegúrate de tener instalados los SDK y herramientas necesarias para Android/iOS y que tu entorno esté configurado correctamente.

## Licencia

Este proyecto se distribuye bajo la licencia indicada en el archivo LICENSE.

## Autor
Adriano Soca
