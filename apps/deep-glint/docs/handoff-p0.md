# DEEP GLINT — Handoff P0

Diperbarui 28 Oktober 2026. Salinan dari dokumen [Claude Docs](https://claude.ai/artifact/G3Si29X6XuqsSWBxa2LswZ).

Turunan dari [daftar aset & animasi](aset-dan-animasi.md), bagian P0: 58 aset yang harus selesai sebelum DEEP GLINT bisa diajukan ke Stake.

**Progres Glint, 28 Oktober 2026:** keempat ubin tier dan tanda primed sudah terpasang, termasuk `apply`, reset, dan gelombang SUPER di runtime. Multiplier ×2–×256 memakai Deep Glint Forge Gold langsung di tepi ubin tanpa bingkai lencana. [Berkas, preview, dan hasil pengujian](../../../../output/ai-game-assets/deep-glint-p0/glint/README.md) tersedia. Pengerjaan Glint Strike dan animasi yang berhubungan dengan karakter ditunda atas arahan pengguna. Layer artistik dan skeleton `glint_super` masih diperlukan untuk handoff.

**Runtime skeleton, 30 Oktober 2026:** skeleton `glint` sudah pindah dari Spine ke [format Kilara Skeleton](../../../packages/components-pixi/src/skeleton/README.md) dan diputar komponen `Skeleton` dari `components-pixi`. Hasilnya sama dengan versi Spine untuk ketujuh animasi: 12.383 nilai pose dibandingkan dan selisihnya nol. Diuji di game untuk durasi normal dan turbo, reduced motion, loop ×256, dan reset. Sumbernya `scripts/glint-skeleton.mjs`; `glint.json` dan `glint.atlas` sudah dihapus dari runtime.

**Paket impor Spine (usang):** [paket ini](../../../../output/ai-game-assets/deep-glint-p0/glint/production-handoff/README.md) disiapkan untuk Import Data di Spine 4.2 sebelum keputusan 30 Oktober. Paket ini tidak dipakai lagi. Dokumen ORA di dalamnya tetap berguna sebagai master berlayer. `prepare-glint-handoff.mjs` dan `verify-glint-handoff.mjs` membaca `glint.json` yang sudah dihapus, jadi kedua skrip itu tidak jalan lagi.

**Tipografi in-game, 28 Oktober 2026:** [Deep Glint Forge](font-bitmap.md), font bitmap dengan glyph original, disetujui pengguna dan sudah dipasang untuk panel kemenangan, free spins, nominal tumble/klaster, dan multiplier. Varian Gold memakai bevel emas; Ink untuk label kecil dan petunjuk. Font UI tetap Geist. File font berada di `static/assets/deep-glint/fonts`, terpisah dari folder font sampel yang masih perlu dibersihkan.

## Lingkup

P0 terbagi ke empat paket yang bisa dikerjakan paralel oleh tiga peran: art 2D, animator skeleton dan sound designer. Semua keputusan sudah diambil, jadi keempat paket bisa mulai.

| Paket                         | Isi                                                                                  | Aset   | Dikerjakan oleh  | Menunggu |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------ | ---------------- | -------- |
| 1. Glint Spots & Glint Strike | 5 gambar spot + 9 kelompok animasi                                                   | 14     | Art 2D, animator | —        |
| 2. Pecah simbol               | 2 animasi pecah + serpih + percik                                                    | 4      | Animator         | —        |
| 3. Pengganti sampel & greybox | Antisipasi, transisi, progress bar, bingkai sel, label klaster, koin, cahaya bingkai | 9      | Art 2D, animator | —        |
| 4. Audio                      | 4 musik + 27 efek suara                                                              | 31     | Sound designer   | —        |
| **Total**                     |                                                                                      | **58** |                  |          |

Setelah aset diterima, developer menyambungkannya ke game; tugasnya ada di bagian Integrasi.

**Selesai artinya:**

- Tidak ada lagi file sampel SDK di build.
- Semua aset di dokumen ini lolos checklist serah terima.
- Game diputar dari spin base sampai free spins dan max win tanpa greybox yang tersisa.

## Keputusan

Keempat keputusan gaya dan produksi diambil pengguna pada 30 Oktober 2026. Paket 1–3 tidak lagi terblokir.

| Keputusan        | Pilihan                                                    | Akibatnya                                                                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gaya material    | **Kilap Jernih** yang mengilap, bukan "besi kusam" pack v4 | Ubin Glint sudah ikut. Simbol v4, serpih, dan panel perlu dibuat ulang dalam gaya ini                                                                                                                                  |
| Warna tier Glint | **Tetap empat tier**: toska, emas, jingga, magenta         | Artwork empat ubin yang ada dipertahankan                                                                                                                                                                              |
| Format animasi   | **Animasi skeleton tanpa Spine Editor**                    | Runtime Spine hanya boleh dipakai pemegang lisensi Spine Editor (lihat di bawah), jadi game memakai [Kilara Skeleton](../../../packages/components-pixi/src/skeleton/README.md) dan tidak ada file `.spine` di handoff |
| Sumber gambar    | **Image generation**                                       | Gambar diam dan layer untuk rig dibuat dengan image generation, lalu dipotong dan diverifikasi lewat skrip                                                                                                             |

**Lisensi runtime Spine.** Header lisensi `spine-core` 4.2 mengizinkan integrasi runtime hanya di bawah Section 2 Spine Editor License Agreement, atau jika setiap pengguna produk punya lisensi Spine Editor sendiri. Tanpa lisensi Editor, skeleton yang ditulis tangan dalam format Spine JSON pun tidak boleh diputar dengan `spine-pixi-v8`. Akibatnya semua spine sampel harus pindah ke runtime sendiri sebelum build diajukan. `glint` sudah pindah pada 30 Oktober 2026.

Audio tidak menunggu apa pun. Efek suara bisa dibuat lewat akun ElevenLabs yang sudah ada (paket Creator, boleh komersial). Lisensi musik dicek sebelum dipakai.

## Spesifikasi teknis umum

Semua ukuran ditulis dalam **sel**. Di game, 1 sel = 100 unit dan papan = 6 × 5 sel. Layout menskalakan semuanya ke layar, jadi yang penting adalah rasio, bukan piksel.

| Hal            | Aturan                                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gambar statis  | Master PNG transparan 1024 px per sel. Runtime WebP 256 px per sel, dibuat oleh `scripts/build-art.mjs` seperti simbol sekarang                                             |
| Skeleton       | Format Kilara Skeleton v1, diputar `Skeleton` dari `components-pixi`. Kirim JSON skeleton + frame sheet JSON + halaman PNG, beserta skrip atau file sumber yang membuatnya  |
| Ukuran         | Game menskalakan skeleton menurut bounding box pose awal. Pose awal harus pas dengan area tujuannya: 1 sel persegi, 1 kolom (1 : 5), atau papan (6 : 5)                     |
| Resolusi sheet | 512 px per sel (2× runtime simbol); satu halaman sheet maksimal 2048 × 2048                                                                                                 |
| Origin         | Tengah area tujuan: tengah sel, tengah kolom, atau tengah papan                                                                                                             |
| Nama           | File kebab-case (`glint-tile-t1.png`). Nama animasi snake_case, persis seperti di tabel, karena kode memanggil nama itu                                                     |
| Durasi         | Ditulis untuk kecepatan normal. Saat turbo game mempercepat animasi, jadi informasinya harus tetap terbaca pada 2× lebih cepat (syarat Stake)                               |
| Akhir animasi  | Animasi satu kali berakhir di pose yang bisa ditampilkan diam. Developer memakai pose itu untuk mode gerak dikurangi                                                        |
| Teks           | Tidak ada huruf atau angka di gambar. Angka ×N, nominal dan semua label ditulis game                                                                                        |
| Cahaya & warna | Specular dari kiri atas, rim tipis di kanan bawah, outline gelap sewarna (bukan hitam). Emas Kilau #FFC53D. Panduan lengkap di `docs/design/art-style.md` di root workspace |
| Folder         | Sumber: `output/ai-game-assets/deep-glint-p0/<paket>/` di root workspace. Runtime: `apps/deep-glint/static/assets/deep-glint/<paket>/`                                      |

## Paket 1 — Glint Spots & Glint Strike

Paket ini menggantikan greybox di `GlintSpots.svelte`: 5 gambar dan 3 skeleton berisi 9 kelompok animasi (beam dan impact dihitung sebagai satu efek strike). Pemain harus bisa membaca nilai tiap spot dalam sekejap, termasuk di mini player 400 × 225, jadi keterbacaan lebih penting dari hiasan.

**Gambar.** Ubin digambar di bawah simbol; multiplier dan tanda primed di atasnya. Semua tier memakai teks langsung tanpa pelat atau bingkai. Empat ubin dan tanda primed sudah tersedia.

| File                           | Key di kode                 | Runtime                                   | Isi                                                                                                    |
| ------------------------------ | --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `glint-primed.png`             | `glintPrimed`               | WebP 128 × 128 px; 21 % sel termasuk halo | Retakan kecil bercahaya, krem; inti sekitar 13 % sel                                                   |
| `glint-tile-t1.png` … `t4.png` | `glintTile1` … `glintTile4` | 240 × 240 px (94 % sel, sudut 14 %)       | Ubin sel menyala, satu per tier warna. Tengahnya cukup tembus agar simbol tetap terbaca; tepinya tegas |

Tier: t1 = 2×–4×, t2 = 8×–16×, t3 = 32×–64×, t4 = 128×–256×.

**Animasi**

| Skeleton                        | Animasi       | Durasi  | Loop  | Diputar saat                        | Isi                                                                                                                |
| ------------------------------- | ------------- | ------- | ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `glint` (1 sel, skin `t1`–`t4`) | `prime`       | 300 ms  | Tidak | Spot 0 → 1                          | Percik kecil, retakan muncul                                                                                       |
|                                 | `light`       | 400 ms  | Tidak | Spot 1 → 2×                         | Ubin menyala dari tengah sel                                                                                       |
|                                 | `double`      | 350 ms  | Tidak | Nilai berlipat dalam tier yang sama | Multiplier berdenyut                                                                                               |
|                                 | `tier_up`     | 500 ms  | Tidak | 4→8, 16→32, 64→128                  | Kilatan besar, skin berganti ke tier baru                                                                          |
|                                 | `max_loop`    | 1,2 dtk | Ya    | Spot di 256×                        | Kilau berputar pelan                                                                                               |
|                                 | `apply`       | 500 ms  | Tidak | Spot dipakai untuk menang           | Spot berkedip; kode menerbangkan ×N ke angka menang                                                                |
|                                 | `reset`       | 250 ms  | Tidak | Awal ronde base                     | Pudar ke kosong                                                                                                    |
| `glint_strike`                  | `beam`        | 300 ms  | Tidak | `glintStrike`                       | Sinar dibuat mendatar sepanjang 1 sel, origin di ujung kiri. Kode memutar dan merentangkannya dari beliung ke spot |
|                                 | `impact`      | 300 ms  | Tidak | Sinar tiba di spot                  | Benturan di tengah sel; kode menahan 300 ms sesudahnya                                                             |
| `glint_super` (papan 6 : 5)     | `super_start` | 800 ms  | Tidak | Awal free spins SUPER               | Gelombang cahaya menyapu papan, lalu 30 spot menyala 2×                                                            |

Titik awal sinar: bone `strike_origin` di ujung beliung pada skeleton karakter (`character.skeleton.json`, sejak 30 Oktober 2026). Event `glint-strike` di 0,5 dtk pose `power` menandai saat sinar dilepas. Rig pengganti wajib mempertahankan nama bone dan event ini.

## Anatomi sel Glint


Ubin berukuran 94 × 94 unit dalam sel 100 × 100. Teks berukuran 30 unit dengan pusat vertikal −32; batas kanan tetap +44. Lebar maksimum ×2–×8 adalah 42 unit, ×16–×64 adalah 60 unit, dan ×128–×256 adalah 74 unit. Teks melebar ke kiri tanpa menambah bingkai.

## Paket 2 — Pecah simbol

Satu skeleton `shatter` dengan dua animasi menggantikan spine sampel `explosion` (folder `symbols3`). Animasi diputar di `tumbleBoard`, sebelum simbol baru jatuh. Scatter tidak pecah.

| Aset           | Jenis                         | Durasi     | Untuk   | Isi                                                                      |
| -------------- | ----------------------------- | ---------- | ------- | ------------------------------------------------------------------------ |
| `gem`          | Animasi `shatter`, 1 sel      | 350–450 ms | H1–H4   | Simbol retak lalu pecah menjadi serpih permata yang terlempar keluar sel |
| `metal`        | Animasi `shatter`, 1 sel      | 350–450 ms | L1–L4   | Huruf/angka logam patah, percik api pendek                               |
| Serpih permata | 3–5 bentuk di sheet yang sama | —          | `gem`   | Pecahan bersudut dengan satu kilap specular                              |
| Percik logam   | 3 bentuk di sheet yang sama   | —          | `metal` | Garis percik dan butir panas                                             |

Aturan warna: badan serpih digambar netral (abu terang) di slot bernama `shard_body`, lalu kode mewarnainya sesuai simbol. Kilap ada di slot `shard_shine` dan tidak diwarnai, jadi tetap putih. Dengan cara ini satu animasi melayani delapan simbol.

| Simbol | Warna serpih |
| ------ | ------------ |
| H1     | Emas         |
| H2     | Rubi         |
| H3     | Zamrud       |
| H4     | Ametis       |
| L1     | Tembaga      |
| L2     | Baja biru    |
| L3     | Timah        |
| L4     | Besi gelap   |

Kedua animasi harus berakhir **kosong**, karena sel itu langsung diisi simbol yang jatuh. Serpih boleh keluar dari batas sel, maksimal setengah sel ke tiap sisi.

## Paket 3 — Pengganti sampel & greybox

Sembilan aset. Empat di antaranya masih **sampel SDK** yang tampil di game: antisipasi, dua transisi dan progress bar. Stake menolak build selama sampel itu ada. Sisanya sekarang digambar kode atau belum ada.

| Aset                       | Sekarang                 | Skeleton / file                                                        | Animasi (nama persis)                                         | Ukuran                                                                                                    | Durasi                                                            |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Kolom antisipasi           | Sampel SDK               | Skeleton `anticipation`                                                | `anticipation_intro`, `anticipation_loop`, `anticipation_out` | 1 kolom (1 : 5)                                                                                           | Intro ± 300 ms, loop 1 dtk, out ± 250 ms                          |
| Transisi masuk free spins  | Sampel SDK               | Skeleton `transition`                                                  | `fs_in`                                                       | Menutup seluruh layar 16 : 9                                                                              | 1,2 dtk; layar tertutup penuh di pertengahan, saat latar berganti |
| Transisi keluar free spins | Sampel SDK               | Skeleton `transition`                                                  | `fs_out`                                                      | Sama                                                                                                      | 0,8 dtk; tertutup penuh di pertengahan                            |
| Progress bar loading       | Sampel SDK               | `progressBarBackground.png`, `progressBar.png`, `progressBarFrame.png` | — (isian dipotong kode dari kiri)                             | Ketiganya 1967 × 346 px dan saling pas                                                                    | —                                                                 |
| Bingkai sel menang         | Belum ada                | `win-cell-frame.png`                                                   | — (kode memunculkan dan memudarkan)                           | 1 sel, 256 px                                                                                             | —                                                                 |
| Latar label angka klaster  | Teks polos               | `win-label.png`, nine-slice ujung bulat                                | —                                                             | Tinggi 0,4 sel                                                                                            | —                                                                 |
| Kilau label angka klaster  | Tween kode               | Skeleton `win_label`                                                   | `pop`                                                         | 1 sel                                                                                                     | 300 ms                                                            |
| Koin / bongkah emas        | Belum ada sebagai efek   | Sprite sheet `coin`                                                    | 8–12 frame berputar                                           | 0,5 sel per frame                                                                                         | Loop ± 0,6 dtk                                                    |
| Cahaya bingkai papan       | Garis emas digambar kode | `board-frame-glow.png`, nine-slice                                     | — (kode berdenyut 1 dtk)                                      | 1374 × 1145 px, slice 152 / 194 / 155 / 226 (kiri / atas / kanan / bawah), sama dengan `board-frame.webp` | —                                                                 |

Catatan:

- Bingkai sel menang digambar netral emas-putih, karena kode mewarnainya mengikuti tier Glint di sel itu.
- Koin dipakai perayaan BIG WIN ke atas dan outro free spins; kode yang mengatur jumlah dan lintasannya.

## Paket 4 — Audio

Kirim 31 file WAV, satu per nama di tabel. Developer menggabungkannya menjadi audio sprite (`sounds.json` + ogg, m4a, mp3, ac3) seperti sekarang, lalu mengganti 52 nama sampel di `sound.ts` dengan nama baru ini.

| Hal               | Aturan                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Format kirim      | WAV 48 kHz / 24-bit. Musik stereo; efek boleh mono                                                                     |
| Loudness (usulan) | Musik ± −18 LUFS terintegrasi, semua file puncak ≤ −1 dBTP. Efek tidak lebih dari 6 dB di atas musik                   |
| Loop              | Sambungan mulus tanpa klik; ekor reverb tidak boleh terpotong di titik loop                                            |
| Nada naik         | `sfx_glint_double` diputar kode makin tinggi per tier, sampai +6 semitone. Harus tetap enak didengar di nada tertinggi |

**Musik**

| Nama           | Kapan                        | Durasi    | Loop  |
| -------------- | ---------------------------- | --------- | ----- |
| `bgm_main`     | Base game                    | 60–90 dtk | Ya    |
| `bgm_freespin` | Free spins                   | 45–60 dtk | Ya    |
| `bgm_winlevel` | Perayaan BIG sampai EPIC WIN | 15–30 dtk | Ya    |
| `jng_maxwin`   | Max win 15.000×              | 4–6 dtk   | Tidak |

**Efek suara**

| Nama                        | Kapan                                        | Durasi    |
| --------------------------- | -------------------------------------------- | --------- |
| `sfx_btn_spin`              | Tombol spin                                  | ≤ 0,3 dtk |
| `sfx_btn_general`           | Tombol lain                                  | ≤ 0,2 dtk |
| `sfx_reel_stop`             | Tiap kolom berhenti                          | ≤ 0,3 dtk |
| `sfx_symbol_land`           | Simbol jatuh saat tumble                     | ≤ 0,3 dtk |
| `sfx_scatter_land_1` … `_5` | Scatter ke-1 sampai ke-5 mendarat, nada naik | ≤ 0,8 dtk |
| `sfx_anticipation_start`    | Antisipasi mulai                             | ≤ 0,6 dtk |
| `sfx_anticipation_loop`     | Selama antisipasi (loop)                     | 1 dtk     |
| `sfx_symbol_win`            | Simbol menang                                | ≤ 0,8 dtk |
| `sfx_shatter_gem`           | Pecah H1–H4                                  | ≤ 0,5 dtk |
| `sfx_shatter_metal`         | Pecah L1–L4                                  | ≤ 0,5 dtk |
| `sfx_glint_prime`           | Spot primed                                  | ≤ 0,3 dtk |
| `sfx_glint_light`           | Spot menyala 2×                              | ≤ 0,5 dtk |
| `sfx_glint_double`          | Spot berlipat                                | ≤ 0,4 dtk |
| `sfx_glint_max`             | Spot mencapai 256×                           | ≤ 1 dtk   |
| `sfx_strike_cast`           | Sinar Glint Strike dilepas                   | ≤ 0,5 dtk |
| `sfx_strike_hit`            | Sinar mengenai spot                          | ≤ 0,4 dtk |
| `jng_fs_trigger`            | Free spins dipicu                            | 2–4 dtk   |
| `sfx_fs_retrigger`          | +5 free spins                                | ≤ 1,5 dtk |
| `sfx_fs_end`                | Free spins selesai                           | 2–3 dtk   |
| `sfx_count_loop`            | Angka menang dihitung naik (loop)            | 0,5–1 dtk |
| `sfx_count_end`             | Hitungan selesai                             | ≤ 1 dtk   |
| `sfx_winlevel_up`           | Perayaan naik tier                           | ≤ 1,5 dtk |
| `sfx_coin_loop`             | Koin selama perayaan (loop)                  | 1–2 dtk   |

Syarat Stake: satu tombol mematikan **semua** suara. Developer memastikan setiap file di atas lewat `sound.ts`.

## Integrasi di kode

Semua tugas ada di `web-sdk/apps/deep-glint`. Tiap paket bisa disambungkan begitu asetnya diterima, tanpa menunggu paket lain.

**Bersih-bersih**

- [ ] Hapus sampel dari `assets.ts`: `explosion`, `anticipation`, `transition`, `progressBar`, `sound`. Hapus juga `payFrame`, `clusterWin` dan `tumble_multiplier`, yang dimuat tapi tidak dipakai.
- [ ] Hapus folder `static/assets/spines`, `sprites`, `fonts` dan `audio` setelah penggantinya masuk.
- [ ] Hapus komponen multiplier sisa PoC: `GlobalMultiplier`, `MultiplierBoard`, `MultiplierBoardBase`, `MultiplierSymbol`, `MultiplierTotal`, `MultiplierValue`.
- [ ] Hapus gambar v4 yang tidak dipakai (H5, tiga multiplier, wild, sekop, panel global multiplier) dari `build-art.mjs` dan `assets.ts`.

**Paket 1 — Glint**

- [x] Pasang ubin tier 1 yang disetujui dengan multiplier bitmap ×2/×4 langsung, tanpa bingkai lencana.
- [x] Ganti greybox tier 2–4 dengan ubin artwork dan teks bitmap langsung tanpa bingkai.
- [x] Ganti tanda primed dengan artwork.
- [x] Bandingkan nilai lama/baru untuk `light`, `double`, dan `tier_up`; jalankan `max_loop` selama nilai ×256 tanpa menahan event. Snapshot tidak memutar ulang upgrade; reset/unmount menyelesaikan playback yang tertunda.
- [x] Tambahkan `prime` untuk transisi 0 → 1.
- [x] Putar `apply` di `winInfo` bila `clusterMult` > 1, pada spot tertinggi di bawah klaster.
- [x] Putar fade reset saat glint dikosongkan: awal ronde base dan akhir free spins.
- [ ] Glint Strike: rentangkan `beam` dari ujung beliung ke tiap spot, lalu `impact`. Total tetap ± 900 ms.
- [x] Putar gelombang `super_start` di runtime pada `updateGlint` pertama free spins SUPER, saat 30 spot langsung menjadi 2×. Efek saat ini dibuat dengan tween kode; skeleton `glint_super` untuk handoff masih perlu dibuat.

**Paket 2 — Pecah**

- [ ] Di `SYMBOL_INFO_MAP`, ganti `explosion` dengan `shatter`: `gem` untuk H1–H4, `metal` untuk L1–L4, dan warna slot `shard_body` per simbol.

**Paket 3 — Pengganti sampel & greybox**

- [ ] `Anticipation.svelte` memakai skeleton baru; sesuaikan `width` ke bounding box 1 kolom.
- [ ] `TransitionAnimation.svelte` memutar `fs_in` saat masuk dan `fs_out` saat keluar, bukan `animation`. Latar berganti tepat di pertengahan.
- [ ] Pak tiga PNG progress bar menjadi sprite sheet dengan nama frame yang sama.
- [ ] Pasang bingkai sel menang dan label klaster (`ClusterWinAmount.svelte`), koin di `Win.svelte` dan `FreeSpinOutro.svelte`, serta cahaya bingkai di `BoardFrame.svelte` menggantikan tiga `Rectangle`.

**Paket 4 — Audio**

- [ ] Bangun audio sprite baru dan ganti `MusicName` serta `SoundEffectName` di `sound.ts`. Semua tier perayaan memakai `bgm_winlevel`; max win memutar `jng_maxwin`.
- [ ] Pasang suara baru di `bookEventHandlerMap.ts` dan komponennya: Glint, strike, pecah, scatter 1–5.

**Verifikasi**

- [ ] Tiap komponen yang berubah punya story Storybook, dan Action-nya selesai di 1200 × 675 dan mini player 400 × 225.
- [ ] Replay base 144 (strike dan 16×) dan bonus 46 (437,8×) tampil benar, ditambah satu free spins SUPER dan satu max win.
- [ ] Turbo tetap terbaca; dengan gerak dikurangi, animasi hanya memudar.
- [ ] Tombol suara mematikan semua audio, dan build tidak memuat aset dari luar (cari `http` di folder build).

## Serah terima

Kirim **satu contoh per paket dulu**: `light` untuk paket 1, `gem` untuk paket 2, `anticipation` untuk paket 3, dan tiga efek suara untuk paket 4. Contoh itu dicek di game sebelum sisanya dikerjakan, supaya salah ukuran atau gaya ketahuan lebih awal.

Tiap paket dikirim sebagai satu folder di `output/ai-game-assets/deep-glint-p0/<paket>/`, berisi:

- Sumber: PSD, ORA atau PNG master berlayer, beserta prompt image generation dan skrip pembuat skeleton.
- Export: JSON skeleton + frame sheet JSON + PNG, atau WAV untuk audio.
- Pratinjau MP4 tiap animasi, di atas latar gelap dan di atas papan.
- `README.md` berisi daftar nama, durasi dan catatan.

Aset diterima setelah developer mengeceknya di game dan pemilik produk menyetujuinya.

**Checklist penerimaan**

- [ ] Nama file dan nama animasi persis sama dengan tabel.
- [ ] Durasi dalam ± 10 % dari tabel.
- [ ] Bounding box pose awal pas dengan area tujuan: sel, kolom, papan atau layar.
- [ ] Animasi satu kali berakhir di pose diam yang benar; `gem` dan `metal` berakhir kosong.
- [ ] Loop tidak punya sambungan yang terlihat atau terdengar.
- [ ] Tidak ada huruf atau angka di gambar, dan tidak ada logo Stake atau game lain.
- [ ] Nilai Glint terbaca di mini player 400 × 225 dan saat turbo.
- [ ] Warna dan material sesuai keputusan gaya; outline tidak hitam murni.
- [ ] JSON skeleton lolos `validateSkeleton` tanpa error.
- [ ] Satu halaman sheet tidak lebih dari 2048 × 2048.
- [ ] Audio berupa WAV 48 kHz / 24-bit, puncak ≤ −1 dBTP, nama sesuai tabel.
