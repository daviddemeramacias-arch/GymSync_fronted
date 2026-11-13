# GymSync Socio — PWA

App instalable del socio. Sin build: HTML + CSS + JS servidos como estáticos.

## Funcionalidad

- **Login con PIN** (`POST /auth/login-pin`) y opción de demo sin backend.
- **Desbloqueo biométrico** con WebAuthn (huella / Face ID del dispositivo).
- **Pase de acceso con QR** generado en el cliente (`gymsync://access?user_id=…&gym_id=…`).
- **Rutinas** asignadas y **tienda** con pedidos y token de pickup.
- **Offline**: service worker para el shell y caché de datos en `localStorage`.

## Correr en local

```bash
npx --yes http-server . -p 4201 -c-1
```

Abrir `http://localhost:4201`. Para probar la biometría, `localhost` cuenta como origen seguro.

La URL de la API se puede cambiar desde **Perfil → Preferencias** (por defecto
`http://localhost:3000/api/v1`). Para probar desde el celular, apuntá esa URL a la IP
de la computadora en la red local.
