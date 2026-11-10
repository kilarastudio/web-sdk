# Deep Glint Forge

Font bitmap original untuk teks in-game Deep Glint, dibuat 28 Oktober 2026. Bentuk huruf digambar sebagai path geometri sendiri di `scripts/font/deep-glint-forge.mjs`; tidak mengambil glyph dari Geist, font SDK, atau TTF pihak ketiga. Sumbernya bisa diedit dan dibangun ulang tanpa editor font berlisensi.

**Status: disetujui pengguna, 28 Oktober 2026.**

## Bentuk dan penggunaan

- **Gold**: huruf tebal dengan sudut terpahat, bevel terang dari kiri atas, permukaan emas, outline cokelat gelap, dan ekstrusi pendek. Untuk judul kemenangan, free spins, nominal tumble/klaster, serta multiplier seluruh tier (×2–×256) yang langsung menyatu dengan ubin tanpa bingkai lencana.
- **Ink**: outline huruf yang sama tanpa dekorasi, warna putih agar bisa ditint saat runtime. Untuk label sangat kecil dan petunjuk lanjut berwarna krem. Multiplier Glint memakai Gold.
- **UI**: balance, bet, tombol, menu, dan dialog tetap memakai Geist. Font ini khusus teks di dalam permainan.

Huruf Latin kecil ditampilkan sebagai kapital gaya signage. Angka 0–9 punya advance yang sama agar nominal tidak bergeser saat count-up. Ada kerning khusus pasangan diagonal seperti AV dan WA. String tetap melalui formatter nominal dan i18n; atlas berisi glyph individual, bukan gambar kata atau nominal utuh.

## Berkas runtime

Di `static/assets/deep-glint/fonts/`:

| File                                 | Isi                                                     |
| ------------------------------------ | ------------------------------------------------------- |
| `deep-glint-forge-gold.fnt` + `.png` | BMFont XML dan atlas Gold                               |
| `deep-glint-forge-ink.fnt` + `.png`  | BMFont XML dan atlas Ink                                |
| `manifest.json`                      | Nama family, cakupan karakter, metrik, dan ukuran atlas |

Masing-masing face memiliki 98 pemetaan karakter pada satu atlas RGBA 1024 × 896. Ukuran native 128 px, cap height 100 px, gutter transparan untuk menghindari bleeding. Kedua PNG berjumlah sekitar 241 KiB. Atlas dan metadata dibundel lokal; tidak ada permintaan font ke CDN dan tidak ada pembuatan atlas dari font sistem di browser.

`assets.ts` memuat kedua font pada tahap preload, sebelum loading-screen/game text. `GameText.svelte` memakai BitmapText dan menyesuaikan skala terhadap `maxWidth`. Font Gold harus memakai fill putih agar warna yang sudah digambar tetap utuh. Stroke dan drop shadow tambahan tidak diterapkan pada BitmapText karena sudah ada di atlas.

## Cakupan bahasa

Cakupan awal: A–Z/a–z, angka, spasi biasa/NBSP/narrow NBSP, tanda baca, perkalian ×, plus/minus, persen, dan simbol `$ € £ ¥ ₹ ₩ ₽ ₺`. Daftar tepat dihasilkan ke `src/game/gameFont.generated.ts` dari sumber glyph yang sama.

Untuk karakter di luar atlas (misalnya huruf beraksen, Mandarin, atau Arab), **seluruh string** memakai canvas Text dengan Geist/system fallback. Ini mempertahankan isi, shaping, dan keterbacaan; cakupan font original belum mencakup semua bahasa. Menambah glyph dilakukan di sumber, lalu menjalankan builder ulang. Jangan menghapus karakter atau menggantinya dengan tanda tanya.

## Membangun ulang dan memeriksa

Dari folder `web-sdk/apps/deep-glint`, dengan Sharp lokal tersedia:

```sh
node scripts/build-game-font.mjs
```

Sama seperti builder art lainnya, `KILARA_SHARP_PATH` dapat menunjuk instalasi Sharp eksternal. Build game biasa tidak memerlukan Sharp karena hasil atlas sudah disertakan. Builder juga menulis master SVG dan specimen PNG ke `output/ai-game-assets/deep-glint-font` di root workspace.

Preview interaktif: Storybook `COMPONENTS/<GameText> → specimen`. Tombol contoh mengganti nominal, format rupiah/euro, dan teks Mandarin untuk memeriksa fallback.

Dengan Storybook berjalan, jalankan:

```sh
node scripts/verify-game-font.mjs
```

`PLAYWRIGHT_MODULE` dapat menunjuk instalasi Playwright eksternal; `GLINT_STORYBOOK_URL` mengubah URL default `http://localhost:6012`. Pemeriksaan memakai Chrome, cache font Pixi, dan node render aktual: atlas statis terdaftar, angka tabular, nominal panjang muat, fallback Mandarin berfungsi, seluruh tier kemenangan, free spins masuk/keluar, dan multiplier langsung sampai ×256 di 1200×675, 390×844, serta 400×225. Screenshot dan laporan tersimpan di folder `verification` di samping specimen.

Dokumentasi runtime: [BitmapText PixiJS 8.22.0](https://github.com/pixijs/pixijs/blob/v8.22.0/skills/pixijs-scene-text/references/bitmap-text.md).
