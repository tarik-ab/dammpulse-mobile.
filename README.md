# DammPulse 360 Mobile

Aplicación móvil nativa para Android e iOS construida con React Native y Expo. Este repositorio es independiente de `damm-pulse`.

## Requisitos

- Node.js 20.19.4 o superior
- npm
- Expo Go para pruebas rápidas o un development build

## Desarrollo

```bash
npm install
npx expo start
```

## Generar APK de pruebas

1. Instala EAS CLI: `npm install -g eas-cli`
2. Inicia sesión: `eas login`
3. Configura el proyecto: `eas build:configure`
4. Genera APK Android: `eas build --platform android --profile preview`

El perfil `preview` está configurado para producir un APK instalable. Para Google Play se preparará un AAB con el perfil `production`.

## Arquitectura inicial

- Interfaz y navegación nativas en `App.tsx`.
- API central configurada en `app.json` (`extra.apiBaseUrl`).
- No contiene una WebView ni reutiliza el frontend web.

## Seguridad

No guardar contraseñas, tokens ni claves privadas en el repositorio. La autenticación se conectará a la API mediante HTTPS.
