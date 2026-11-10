# Preview Storybook melalui Tailscale

Saat pekerjaan mengubah tampilan atau animasi yang dapat diperiksa di Storybook, siapkan preview agar pengguna dapat mengujinya dari perangkat lain melalui Tailscale. Buat atau perbarui story yang relevan jika diperlukan, lalu sertakan tautan langsung ke story dalam jawaban. Jika story memiliki tombol **Action**, jelaskan cara memakainya.

- Periksa alamat saat ini dengan `tailscale ip -4`; jangan mengandalkan alamat IP lama.
- Gunakan server Storybook yang sudah berjalan jika story yang tepat dapat diakses melalui alamat Tailscale. Jika server hanya mendengarkan `localhost`, jalankan server lain pada port yang tersedia tanpa menghentikan proses yang tidak terkait.
- Untuk Deep Glint, jalankan dari `apps/deep-glint`:

  ```sh
  PUBLIC_CHROMATIC=true pnpm exec storybook dev --host 0.0.0.0 -p 6013 --ci --no-open --disable-telemetry
  ```

  Jika port 6013 dipakai oleh layanan lain, pilih port kosong dan gunakan port itu dalam tautan. Server yang mendengarkan `0.0.0.0` juga dapat diakses melalui jaringan lokal, bukan hanya Tailscale.
- Pastikan server siap dan uji story melalui alamat Tailscale, termasuk **Action** jika ada. Berikan tautan berbentuk `http://<tailscale-ip>:<port>/?path=/story/<story-id>`, bukan tautan `localhost`.
- Biarkan server berjalan untuk preview, dan jelaskan bahwa preview tersedia selama proses Storybook dan koneksi Tailscale aktif. Jika Tailscale atau server tidak tersedia, sebutkan hambatannya dan hasil pemeriksaan yang berhasil.
