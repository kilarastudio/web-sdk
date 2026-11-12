# Preview Storybook melalui Tailscale

Saat pekerjaan mengubah tampilan atau animasi yang dapat diperiksa di Storybook, siapkan preview agar pengguna dapat mengujinya dari perangkat lain melalui Tailscale. Buat atau perbarui story yang relevan jika diperlukan, lalu sertakan tautan langsung ke story dalam jawaban. Jika story memiliki tombol **Action**, jelaskan cara memakainya.

- Periksa alamat saat ini dengan `tailscale ip -4`; jangan mengandalkan alamat IP lama.
- Gunakan server Storybook yang sudah berjalan jika story yang tepat dapat diakses melalui alamat Tailscale. Jika server hanya mendengarkan `localhost`, jalankan server lain pada port yang tersedia tanpa menghentikan proses yang tidak terkait.
- Untuk Dragon's Glint, jalankan dari `apps/dragons-glint`:

  ```sh
  PUBLIC_CHROMATIC=true pnpm exec storybook dev --host 0.0.0.0 -p 6108 --ci --no-open --disable-telemetry
  ```

  Jika port 6108 dipakai oleh layanan lain, pilih port kosong dan gunakan port itu dalam tautan. Server yang mendengarkan `0.0.0.0` juga dapat diakses melalui jaringan lokal, bukan hanya Tailscale.
- Pastikan server siap dan uji story melalui alamat Tailscale, termasuk **Action** jika ada. Berikan tautan berbentuk `http://<tailscale-ip>:<port>/?path=/story/<story-id>`, bukan tautan `localhost`.
- Biarkan server berjalan untuk preview, dan jelaskan bahwa preview tersedia selama proses Storybook dan koneksi Tailscale aktif. Jika Tailscale atau server tidak tersedia, sebutkan hambatannya dan hasil pemeriksaan yang berhasil.

# Sudut UI: tanpa border radius

UI Kilara memakai sudut siku. Jangan memakai `border-radius` (CSS), `roundRect`, atau radius lain pada panel, dock, tombol ikon, field, menu, modal, kartu, scrollbar, maupun persegi Pixi.

Satu-satunya pengecualian adalah bentuk lingkaran utuh, yaitu `border-radius: 50%` pada tombol bulat (hanya spin/stop; buy bonus kotak), titik Kilau, dan kenop switch, serta potongan atau gambar lingkaran seperti notch dock dan `Circle`. Bentuk pil (`999px`) tidak termasuk pengecualian.

# Logo Kilara: dikunci

Logo "Tegas" sudah final (dikunci 10 November 2026). Jangan menggambar ulang, mengganti font, mengubah warna, atau menambah efek (kilap, glow, gradien) tanpa permintaan eksplisit dari pengguna.

- Bentuk logo ada di `packages/components-ui-html/src/components/kilaraLogo.ts`. File ini dibuat oleh `brand/logo/source/kilara_logo.py` di workspace stake-engine. Jangan mengedit `kilaraLogo.ts` dengan tangan; ubah generatornya, lalu jalankan ulang.
- `UiLogo` (HUD) dan `StudioIntro` (intro studio) memakai data yang sama.
- Animasi intro: huruf naik dari garis dasar, titik Kilau jatuh dan memantul, lalu STUDIO muncul. Tanpa kilap atau cahaya.
