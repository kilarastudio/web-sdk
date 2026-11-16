# Pratala art v2: semua seni digambar kode, dalam bentuk dan ruang yang nyata

Keputusan pengguna 2026-11-17, sesudah hasil review Engine v1 (5,7; "boring symbol design,
limited animations"): seluruh seni dibuat ulang. Latar (ruang harus nyata secara bentuk dan
ruang), tempat reel, simbol (bentuknya yang terpenting, jangan membosankan, set lama diganti),
simbol bonus, dan semua animasi. Pixel art sungguhan: tidak ada gambar generatif yang
dipikselkan, karena hasil generatif sering salah bentuk. Tiap bentuk diverifikasi sampai lolos,
lalu semuanya digabung jadi game.

## Cara menggambar: renderer SDF ke palet

Semua gambar lahir dari `src/pixel/render`: adegan 3D sebagai signed distance field (balok,
silinder, bola, kapsul, lengkung, dipotong dan digabung), kamera perspektif, cahaya titik
(obor, bara, mata) dengan bayangan lunak dan ambient occlusion, bahan dengan tekstur
prosedural (batu, logam, kristal, emas), lalu tiap piksel dikuantisasi ke palet dengan
ordered dither dan garis tinta di lompatan kedalaman. Hasilnya `PixelCanvas` (indeks palet),
seperti seni kode yang sudah ada, dan dipakai alat yang sama (`toRGBA`, `png`, `sheet`).

Kenapa begini, bukan primitif 2D seperti `symbols.ts` lama: volume, satu arah cahaya untuk
seluruh layar, bayangan, dan putaran benda datang dari geometrinya, bukan dari tangan. Frame
animasi (benda berputar, terbakar, pecah) adalah render ulang dari sudut atau keadaan lain.

Kepadatan tetap satu: 1 piksel seni = 2,5 unit game; sel reel 40 piksel seni; latar lebar
576 × 324, tegak 324 × 576. Simbol mengisi 34 sampai 36 dari 40 piksel selnya.

Palet: Endesga 64 sebagai dasar; ramp tambahan boleh ditambah bila kuantisasi memerlukan
(dicatat di `palette.ts`).

## Status 2026-11-17

Selesai dan terpasang di game: renderer, aula (mata di kubah, bukan di dinding belakang),
nampan papan, sepuluh simbol dengan frame diam, menang dan pergi, sigil Glint Spot, koin, gambar
mode, frame mata aula (grid 3 × 3), pembuka free spins "naga bangun" (`FreeSpinGaze.svelte`:
mata siaga, obor meredup, tatapan menyapu papan dan menyalakan scatter, kata-kata mendarat).
Dikerjakan terakhir: reaksi kolom berhenti (debu dan sentakan bingkai) dan hidup saat diam.

## Yang dibuat, urutannya, dan cara lolosnya

| # | Bagian | Sumber | Lolos bila |
| --- | --- | --- | --- |
| 0 | Renderer (`src/pixel/render`): sdf, noise, raymarch, quantize, png | kode | Adegan uji: lantai batu beralur, pilar, bola, satu obor; bayangan dan dither terbaca di 1× |
| 1 | Aula (base dan bonus, lebar dan tegak): lantai perspektif, pilar, kubah, dinding belakang pecah, mata, obor | `render/hall.ts` → `static/assets/backgrounds` | Ruang terbaca sebagai satu aula dari satu kamera; mata terlihat utuh di atas papan pada 1280×800; obor menyinari pilar dengan bayangan; bonus = aula yang sama membara |
| 2 | Tempat reel: nampan batu dalam kamera aula, bayangan jatuh ke lantai, lantai sel | `render/board.ts` → `ui.ts` | Bingkai terbaca sebagai benda di aula, bukan stiker |
| 3 | Simbol: model 3D tiap simbol, pose diam | `render/symbols/*.ts` | Tiap simbol: siluet terbaca di 40 px dan di 400×225; satu arah cahaya; tidak ada yang bisa disebut ikon stok |
| 4 | Frame simbol: diam (hidup), menang, pergi; scatter dan mata | render ulang | Gerak terbaca di contact sheet 10 fps |
| 5 | Penggabungan: aset, `SymbolSprite`, `Background`, mata, obor, api lantai | kode game | Game berjalan headless di 5 ukuran reviewer tanpa galat |
| 6 | Animasi baru: kolom berhenti, antisipasi, menang, big win, free spins masuk dan keluar | kode game | Gerak diam ≥ 2,0; contact sheet; review `stake-reviewer` |

## Set simbol v2 (usulan, dirender dulu lalu diputuskan pengguna)

Dunia yang sama: aula Antaboga, naga yang terlalu besar untuk dilihat utuh.

- S: mata naga, bola bercahaya dengan pupil celah di antara kelopak bersisik (dimodel 3D).
- H1: tengkorak naga kecil berlapis emas, dua tanduk besi, bara di rongga mata.
- H2: keris pusaka, bilah berliku dengan pamor, hulu emas, lilitan kain merah.
- H3: terompet perang (tanduk) dengan gelang logam.
- H4: lentera besi dengan api di dalam (menyala sendiri, hidup saat diam).
- L1 sampai L4: gugus kristal gua, merah, biru, hijau, ungu, tiap warna bentuk gugus sendiri,
  tumbuh dari sedikit batu.
- W: koin emas bermata (tidak pernah di reel).

Aturan studio tetap: tanpa sparkle, tanpa permata sebagai hiasan, benda padat tanpa squash,
sudut siku di UI.
