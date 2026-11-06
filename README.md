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

El repositorio incluye GitHub Actions para compilar automáticamente un APK Android de depuración al actualizar `main` o manualmente desde Actions. El artefacto se publica como `dammpulse-360-prototype-apk`.

## Arquitectura inicial

- Interfaz y navegación nativas en `App.tsx`.
- API central configurada en `app.json` (`extra.apiBaseUrl`).
- No contiene una WebView ni reutiliza el frontend web.

## Seguridad

No guardar contraseñas, tokens ni claves privadas en el repositorio. La autenticación se conectará a la API mediante HTTPS.
