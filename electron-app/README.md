# Subservice Hub — Aplikasi Desktop (Windows)

Aplikasi ini membuka Subservice Hub (https://subservice-hub.lovable.app) di jendela
aplikasi sendiri. Tetap butuh koneksi internet karena data tersimpan di cloud.

## A. Versi portable (sudah jadi)

Unduh `SubserviceHub-Windows-portable.zip`, ekstrak, lalu klik dua kali
`Subservice Hub.exe`. Tidak perlu instal.

## B. Membuat installer .exe sendiri (di komputer Windows)

Butuh Node.js 20+ (https://nodejs.org).

1. Salin folder `electron-app` ini ke komputer Windows Anda.
2. Buka Command Prompt di folder tersebut, jalankan:

   ```
   npm install --save-dev electron electron-builder
   npm run make:installer
   ```

3. Installer siap di folder `dist/`, namanya
   `Subservice Hub Setup 1.0.0.exe` — installer resmi sekali-klik yang bisa
   dibagikan ke pengguna lain.

Ingin folder portable saja (tanpa installer):

```
npm install --save-dev electron @electron/packager
npm run package:win
```

Hasilnya ada di `release/Subservice Hub-win32-x64/`.

## Catatan

- Ganti alamat aplikasi (misal jika pakai domain sendiri) lewat variabel
  lingkungan `SUBSERVICE_HUB_URL`, atau ubah nilai `APP_URL` di `main.cjs`.
- Ikon: letakkan `icon.ico` (256x256) di folder ini sebelum build agar ikon
  aplikasi memakai logo Anda.
