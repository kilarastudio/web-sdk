# DEEP GLINT — Daftar Aset & Animasi

Diperbarui 28 Oktober 2026. Salinan dari dokumen [Claude Docs](https://claude.ai/artifact/HT1XqSJ6RLBzziLUqsTZky). Langkah P0 dijabarkan di [handoff P0](handoff-p0.md).

DEEP GLINT butuh **115 aset** untuk rilis: **36 sudah ada di runtime** (gambar statis Kilara Mine v4 serta ubin, tanda primed, dan animasi Glint) dan **79 harus dibuat**, hampir semuanya animasi dan audio. Stake menolak game yang masih memakai art, animasi atau audio sampel SDK, jadi semua sampel di bawah wajib diganti sebelum submit.

## Sekilas

| Kelompok                   | Gambar statis | Animasi / suara | Sudah ada | Harus dibuat |
| -------------------------- | ------------- | --------------- | --------- | ------------ |
| Simbol                     | 9             | 13              | 9         | 13           |
| Glint Spots & Glint Strike | 5             | 9               | 13        | 1            |
| Karakter penambang         | 1 rig         | 6               | 0         | 7            |
| Papan, latar & transisi    | 5             | 5               | 3         | 7            |
| Panel & perayaan           | 10            | 9               | 8         | 11           |
| Efek visual                | —             | 7               | 0         | 7            |
| Loading, judul & teks      | 3             | 2               | 3         | 2            |
| Audio                      | —             | 31              | 0         | 31           |
| **Total**                  | **33**        | **82**          | **36**    | **79**       |

Yang **tidak** dibutuhkan dan sebaiknya dihapus dari build: Wild (W), lentera H5, tiga simbol multiplier, sekop L4 lama, panel global multiplier, serta seluruh folder sampel `static/assets/spines`, `sprites`, `fonts` dan `audio`. Semuanya sisa PoC atau SDK.

## Simbol

Kesembilan gambar simbol sudah ada; yang kurang adalah animasinya. Sekarang simbol yang menang hanya berdenyut dua kali lewat kode, dan ledakannya masih spine sampel SDK.

**Gambar statis**: master PNG 1254 px, runtime WebP 256 × 256 di `kilara-mine-v4/runtime`.

| Kode | Simbol                  | File runtime                  | Status |
| ---- | ----------------------- | ----------------------------- | ------ |
| H1   | Bijih emas              | `symbol-h1-gold-ore.webp`     | Ada    |
| H2   | Bijih rubi              | `symbol-h2-ruby-ore.webp`     | Ada    |
| H3   | Prisma zamrud           | `symbol-h3-emerald-ore.webp`  | Ada    |
| H4   | Kristal ametis          | `symbol-h4-amethyst-ore.webp` | Ada    |
| L1   | K tembaga               | `symbol-l1-k-copper.webp`     | Ada    |
| L2   | Q baja                  | `symbol-l2-q-steel.webp`      | Ada    |
| L3   | J timah                 | `symbol-l3-j-tin.webp`        | Ada    |
| L4   | 10 besi tempa           | `symbol-l4-10-iron.webp`      | Ada    |
| S    | Kunci brankas (scatter) | `symbol-scatter.webp`         | Ada    |

**Animasi**: durasi mengikuti baseline gerak Kilara (kolom jatuh berjarak 200 ms, settle tegas ≤ 2,5 %, antisipasi ± 1 dtk).

| Animasi          | Untuk                           | Kapan diputar            | Durasi                                    | Format            | Status       |
| ---------------- | ------------------------------- | ------------------------ | ----------------------------------------- | ----------------- | ------------ |
| Mendarat         | 8 simbol biasa                  | `reveal`, `tumbleBoard`  | ± 110 ms                                  | Kode              | Ada          |
| Menang           | 8 simbol biasa, satu per simbol | `winInfo`                | 720 ms (2 ketukan), bisa diulang          | Skeleton          | Harus dibuat |
| Pecah permata    | H1–H4, diwarnai per simbol      | `tumbleBoard`            | 350–450 ms                                | Skeleton + serpih | Sampel SDK   |
| Pecah logam      | L1–L4, diwarnai per simbol      | `tumbleBoard`            | 350–450 ms                                | Skeleton + percik | Sampel SDK   |
| Scatter mendarat | S                               | `reveal`                 | 300 ms + kilau                            | Skeleton          | Harus dibuat |
| Scatter menunggu | S                               | Saat antisipasi berjalan | Loop 1 dtk                                | Skeleton          | Harus dibuat |
| Scatter memicu   | S                               | `freeSpinTrigger`        | 1,2 dtk (kunci berputar, brankas terbuka) | Skeleton          | Harus dibuat |

Syarat produksi:

- Untuk di-rig sebagai skeleton, tiap simbol perlu dipecah per layer dari masternya: badan, kilap specular dan titik kilau.
- Animasi menang memakai resep kilap Kilap Jernih: sapuan specular dari kiri atas, denyut 12 % dan satu kilatan bintang.
- Saat turbo, semua animasi harus tetap terbaca karena itu syarat Stake. Durasinya dibagi `timeScale`, bentuknya tidak dipangkas.
- Varian blur saat reel berputar boleh ditunda: grid tumble hanya jatuh sekali per putaran.

## Glint Spots & Glint Strike

Ini mekanik inti DEEP GLINT. Keempat tier sudah memakai ubin artwork dan multiplier ×2–×256 dari font bitmap Deep Glint Forge Gold langsung di tepi ubin, tanpa pelat atau bingkai lencana. Tier 1 serta arah tanpa lencana sudah disetujui; tier 2–4 mengikuti bentuk yang sama. Angka ×N tetap teks runtime.

Lingkup kini 5 gambar dan 9 kelompok animasi setelah seluruh lencana dihapus. Empat ubin, tanda primed, dan delapan kelompok animasi tersedia di runtime, termasuk apply, reset dan gelombang SUPER. Hitungan “sudah ada” menyatakan implementasi runtime; gelombang SUPER dan reset memakai tween kode, sementara skeleton `glint_super`, file proyek native `.spine`, dan layer artistik masih perlu dilengkapi untuk handoff. Efek strike masih greybox dan ditunda bersama animasi karakter atas arahan pengguna.

| Nilai spot | Tampilan                                     | Warna   | Status gambar               |
| ---------- | -------------------------------------------- | ------- | --------------------------- |
| 0          | Tidak ada                                    | —       | —                           |
| 1 (primed) | Retakan kecil bercahaya di pojok sel         | Krem    | Terpasang                   |
| 2×–4×      | Ubin + ×N langsung di kanan atas             | Toska   | Tier 1 terpasang; disetujui |
| 8×–16×     | Ubin + ×N langsung                           | Emas    | Tier 2 terpasang            |
| 32×–64×    | Ubin + ×N langsung                           | Jingga  | Tier 3 terpasang            |
| 128×–256×  | Ubin + ×N langsung; kilau berulang pada ×256 | Magenta | Tier 4 terpasang            |

**Animasi**

| Animasi            | Kapan diputar                                                            | Durasi                  | Catatan                                                        |
| ------------------ | ------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------- |
| Prime (0 → 1)      | `updateGlint` saat simbol menang, sebelum pecah                          | 300 ms                  | Terpasang: percik kecil, retakan muncul                        |
| Menyala (1 → 2×)   | `updateGlint`                                                            | 400 ms                  | Terpasang: ubin menyala dari tengah sel                        |
| Lipat dua (N → 2N) | `updateGlint`                                                            | 350 ms                  | Terpasang: multiplier berdenyut dan angka berganti lewat fade  |
| Naik tier warna    | 4→8, 16→32, 64→128                                                       | 500 ms                  | Terpasang: crossfade warna dan kilatan lebih besar             |
| Maksimum 256×      | Nilai mencapai batas                                                     | Loop                    | Terpasang: loop 1,2 dtk; tidak menahan event berikutnya        |
| Dipakai menang     | `winInfo` dengan `clusterMult` > 1                                       | 500 ms                  | Terpasang: spot tertinggi berkedip, ×N terbang ke angka menang |
| Reset              | Awal ronde base dan akhir free spins                                     | 250 ms                  | Terpasang: fade; spot tetap hidup selama free spins            |
| Glint Strike       | `glintStrike`: 5 % spin base/ante, tiap spin BOOST, awal tiap free spins | 900 ms (600 + jeda 300) | Ditunda bersama animasi karakter                               |
| Mulai SUPER        | Awal free spins mode SUPER (30 spot × 2)                                 | 800 ms                  | Terpasang di runtime sebagai tween; skeleton masih diperlukan  |

Glint Strike memutar pose `power` karakter di saat yang sama. Sinar dilepas sekitar 0,5 dtk setelah pose dimulai, jadi animator karakter dan efek perlu sepakat titik lepasnya.

## Karakter penambang

Karakter butuh 1 rig skeleton dengan 6 pose. Nama pose sudah dipakai `Character.svelte`, jadi animasi cukup diberi nama yang sama untuk langsung tersambung.

**Status, 30 Oktober 2026: gambar pose + gerak kecil.** Rig cutout dari satu gambar pose A (rig v1) ditinggalkan, karena rotasi besar selalu memperlihatkan bagian yang tidak pernah digambar. Sekarang setiap pose punya gambar utuh sendiri dalam gaya Kilap Jernih, dibuat dengan image generation dari satu master:

| Pose           | Gambar                                                      | Gerak di skeleton                                                                          |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `idle`         | bersandar pada beliung                                      | napas dari kaki (skala 1,4 %), sedikit condong, lampu berdenyut                            |
| `anticipation` | condong ke papan, beliung siap                              | denyut tegang, lampu terang                                                                |
| `power`        | ancang-ancang → hantaman (0,46 dtk) → sesudahnya (0,68 dtk) | pop + kilau tiap ganti gambar, jejak ayunan saat hantaman, event `glint-strike` di 0,5 dtk |
| `win`          | kepalan diangkat                                            | pop, satu lompatan                                                                         |
| `bigWin`       | kedua lengan dan beliung diangkat                           | dua lompatan per putaran, mendarat dengan squash                                           |
| `bonus`        | menunjuk papan, beliung di bahu                             | pop, lompatan kaget                                                                        |

- Sumber: `output/ai-game-assets/deep-glint-p0/character/poses/final/` (master `idle` = varian 1; ancang-ancang diperbaiki agar gagangnya lurus; hantaman, sesudahnya, `win`, `bigWin` dan `bonus` dibuat ulang dengan aturan ukuran yang sama). Versi lama ada di `poses/v1` dan `poses/v2`.
- Konsistensi: tiap gambar diskalakan ke lebar helm `idle` dan diletakkan di titik tengah kedua sepatu di atas sol terendah. Hasilnya diperiksa dengan menjajarkan delapan pose di satu garis tanah (helm, sepatu, sabuk dan beliung sejajar).
- Builder: `scripts/character-poses.mjs` → `static/assets/deep-glint/character/` (sheet 2048 × 1998, ±630 KB). Bone `strike_origin` ada di kepala beliung pada gambar hantaman. QA: `scripts/verify-character.mjs`; story **COMPONENTS/Character Rig → Poses**.
- Rig cutout v1 tetap tersedia untuk catatan (`scripts/character-skeleton.mjs` → `static/assets/deep-glint/character-rig/`, story **Cutout rig range of motion**), tidak dipakai game.

## Papan, latar & transisi

Latar dan bingkai sudah ada sebagai gambar diam. Yang kurang: latar khusus portrait, gerak ambien, cahaya bingkai, dan transisi ke/dari free spins yang masih sampel SDK.

| Aset                                  | Jenis                | Kapan terlihat            | Status                    | Catatan                                                       |
| ------------------------------------- | -------------------- | ------------------------- | ------------------------- | ------------------------------------------------------------- |
| Latar base (`background-base`)        | Gambar 2560 × 1440   | Base                      | Ada                       | Diperbesar dari sumber 1672 × 941; perlu sumber resolusi asli |
| Latar free spins (`background-bonus`) | Gambar 2560 × 1440   | Free spins                | Ada                       | Sama                                                          |
| Latar base portrait                   | Gambar 1440 × 2560   | Base di ponsel            | Harus dibuat              | Sekarang latar landscape dipotong                             |
| Latar free spins portrait             | Gambar 1440 × 2560   | Free spins di ponsel      | Harus dibuat              | Sama                                                          |
| Bingkai papan (`board-frame`)         | Nine-slice           | Selalu                    | Ada                       |                                                               |
| Ambien base                           | Loop                 | Base                      | Harus dibuat              | Debu melayang, lampu tambang berkedip                         |
| Ambien free spins                     | Loop                 | Free spins                | Harus dibuat              | Kilau emas, cahaya berdenyut pelan                            |
| Cahaya bingkai                        | Loop                 | Antisipasi dan free spins | Greybox kode (garis emas) | Garis cahaya mengikuti bingkai                                |
| Transisi masuk free spins             | Satu kali, ± 1,2 dtk | Setelah intro free spins  | Sampel SDK (`transition`) | Sapuan debu emas menutup layar, latar berganti di belakangnya |
| Transisi keluar free spins            | Satu kali, ± 0,8 dtk | Setelah outro             | Sampel SDK                | Kebalikan transisi masuk                                      |

## Panel & perayaan

Delapan panel sudah ada sebagai gambar diam, dengan teks yang digambar runtime (Geist). Yang kurang: semua animasinya, banner retrigger dan label angka menang di klaster. Panel global multiplier tidak dipakai DEEP GLINT dan dibuang.

| Aset                                       | Kapan diputar           | Gambar                             | Animasi yang dibutuhkan                                           |
| ------------------------------------------ | ----------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Panel tumble win                           | Selama rangkaian tumble | Ada                                | Muncul, angka bertambah dengan denyut tiap tumble                 |
| Intro free spins ("YOU WON 12 FREE SPINS") | `freeSpinTrigger`       | Ada                                | Masuk 400 ms dengan kilap, angka spin bergulir                    |
| Outro free spins                           | `freeSpinEnd`           | Ada                                | Masuk, total menang dihitung naik, koin di belakang panel         |
| Banner retrigger "+5"                      | `freeSpinRetrigger`     | Harus dibuat                       | Muncul cepat di atas papan, lalu terbang ke penghitung free spins |
| Label angka menang di klaster              | `winInfo`               | Harus dibuat (sekarang teks polos) | Muncul di tengah klaster, naik, pudar                             |
| BIG WIN                                    | Kemenangan tier 6       | Ada                                | Masuk, kilau loop, keluar                                         |
| SUPER WIN                                  | Tier 7                  | Ada                                | Naik tier dari panel sebelumnya                                   |
| MEGA WIN                                   | Tier 8                  | Ada                                | Sama                                                              |
| EPIC WIN                                   | Tier 9                  | Ada                                | Sama                                                              |
| MAX WIN (15.000×)                          | `wincap`                | Ada                                | Perlakuan paling besar; free spins berhenti di sini               |

Kelima panel perayaan memakai satu set animasi bersama, dibuat sekali: **masuk, naik tier, loop kilau, keluar**. Jumlah koin naik per tier. Total animasi di bagian ini 9: lima untuk panel dan label, empat untuk perayaan.

Aturan teks: "BIG WIN", "FREE SPINS", "YOU WON" dan semua kata lain tetap teks runtime, tidak boleh tercetak di gambar. Teks harus lewat i18n dan versi social mode, dan reviewer Stake memeriksa teks di dalam gambar.

## Efek visual

Tujuh efek dipakai ulang oleh simbol, Glint dan perayaan. Semuanya belum ada atau masih sampel SDK. Sebaiknya dibuat sebagai sprite sheet atau tekstur partikel kecil, bukan animasi utuh, supaya bisa dipakai di banyak tempat.

| Efek                  | Dipakai di                        | Bentuk                                                  | Status                                                  |
| --------------------- | --------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Bongkah emas / koin   | Perayaan, outro free spins        | Sprite sheet berputar, 8–12 frame                       | Belum ada                                               |
| Kilau bintang 4 sudut | Simbol menang, Glint, logo, panel | Tekstur partikel, 3 ukuran                              | Harus dibuat                                            |
| Serpih permata        | Pecah H1–H4                       | Tekstur partikel, diwarnai per simbol                   | Harus dibuat                                            |
| Percik logam          | Pecah L1–L4                       | Tekstur partikel                                        | Harus dibuat                                            |
| Kepulan debu          | Simbol jatuh saat tumble          | Sprite sheet pendek                                     | Harus dibuat                                            |
| Kolom antisipasi      | Kolom yang menunggu scatter       | Loop ± 1 dtk, cahaya + percik naik                      | Sampel SDK (`anticipation`)                             |
| Bingkai sel menang    | Sel di klaster yang menang        | Sprite, mengikuti warna tier Glint bila sel itu menyala | Belum ada (`payFrame` sampel dimuat tapi tidak dipakai) |

## Loading, judul & teks

Sebagian besar bagian ini sudah beres. Yang tersisa hanya progress bar milik Kilara dan, kalau mau, kilau pada logo.

| Aset                                                     | Status                  | Catatan                                                                                                    |
| -------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Intro studio Kilara (`StudioIntro`)                      | Ada                     | Sama di semua game Kilara, ± 2,3 dtk                                                                       |
| Logo DEEP GLINT dengan penambang (`logo-character.webp`) | Ada                     | Hanya di layar loading; di dalam game tidak ada logo                                                       |
| Progress bar loading                                     | Harus dibuat            | Masih sprite sampel `progressBar`; bisa digambar kode dengan warna Kilau                                   |
| Kilau pada logo                                          | Harus dibuat (opsional) | Sapuan specular pelan selama loading                                                                       |
| Font UI & font game                                      | Ada                     | Geist untuk UI; [Deep Glint Forge](font-bitmap.md) bitmap original untuk in-game. Keduanya dibundel lokal. |

Syarat Stake untuk bagian ini:

- Tidak boleh ada loader, logo atau splash Stake Engine di mana pun, termasuk saat replay.
- Judul tidak boleh memuat istilah terlarang (aturan 213). "DEEP GLINT" aman.
- "Press anywhere to continue" dan semua teks lain tetap teks runtime.
- Bitmap font sampel (`goldFont`, `silverFont`, `purpleFont`, `goldBlur`) tidak dipakai; penghapusan folder sampel masih bagian pembersihan P0. Teks in-game memakai **Deep Glint Forge**, dengan bentuk glyph original yang diraster menjadi atlas bitmap. String dan angka tetap disusun saat runtime; Geist tetap untuk UI dan fallback karakter di luar atlas.

## Audio

Seluruh audio masih sprite sampel Mining Mayhem (`sounds.json`, 7 musik dan 43 efek). DEEP GLINT butuh 4 musik dan 27 efek suara sendiri. Jumlahnya lebih sedikit dari sampel karena multiplier lama dan wild tidak ada lagi.

**Musik**

| Musik           | Kapan                   | Bentuk                                            |
| --------------- | ----------------------- | ------------------------------------------------- |
| Base            | Base game               | Loop 60–90 dtk, tenang, nuansa tambang            |
| Free spins      | Selama free spins       | Loop, lebih cepat dan terang                      |
| Perayaan menang | BIG WIN sampai EPIC WIN | Loop dengan lapisan intensitas yang naik per tier |
| Max win         | `wincap`                | Jingle satu kali                                  |

**Efek suara**

| Kejadian        | Efek                                                          | Jumlah |
| --------------- | ------------------------------------------------------------- | ------ |
| Tombol          | Spin, tombol umum                                             | 2      |
| Reel            | Reel berhenti, simbol mendarat saat tumble                    | 2      |
| Scatter         | Mendarat ke-1 sampai ke-5, nada naik                          | 5      |
| Antisipasi      | Mulai, loop                                                   | 2      |
| Menang          | Simbol menang                                                 | 1      |
| Pecah           | Permata, logam                                                | 2      |
| Glint Spots     | Prime, menyala, lipat dua (nada naik per tier), mencapai 256× | 4      |
| Glint Strike    | Lepas, benturan                                               | 2      |
| Free spins      | Dipicu (jingle), retrigger, selesai                           | 3      |
| Hitungan menang | Loop, selesai                                                 | 2      |
| Perayaan        | Naik tier, koin loop                                          | 2      |
| **Total**       |                                                               | **27** |

Syarat Stake: satu tombol yang terlihat harus mematikan **semua** audio (aturan 107). Semua suara lewat `sound.ts`, tidak ada yang memutar langsung. Untuk produksi, akun ElevenLabs (paket Creator, boleh komersial) sudah tersedia untuk efek suara; lisensi musik perlu dipastikan sebelum dipakai.

## Alur animasi satu putaran


Kotak bergaris putus hanya terjadi sesekali. Tiap free spin mengulang langkah dari reveal sampai setWin, dengan Glint Spots tetap menyala dari spin ke spin.

## Urutan pengerjaan

Kerjakan dulu **P0, 58 aset**: semua sampel SDK dan greybox yang tersisa, termasuk Glint, karena keduanya menentukan lolos review dan terbacanya mekanik. P1 menentukan kualitas rilis. P2 boleh menyusul setelah rilis.

| Prioritas | Aset                                                                                                                                    | Jumlah | Alasan                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| P0        | Glint Spots & Glint Strike, gambar + animasi                                                                                            | 14     | Mekanik inti, empat tier, primed, dan lima animasi terpasang      |
| P0        | Pecah permata/logam, serpih, percik                                                                                                     | 4      | Menggantikan ledakan sampel                                       |
| P0        | Kolom antisipasi, bingkai sel menang, label angka klaster (gambar + animasi), koin, transisi masuk/keluar, cahaya bingkai, progress bar | 9      | Sampel SDK (antisipasi, transisi, progress bar) atau greybox      |
| P0        | Audio: 4 musik + 27 efek                                                                                                                | 31     | Seluruhnya masih sampel                                           |
| P1        | Karakter: rig + 6 pose                                                                                                                  | 7      | Rig v1 + blockout 6 pose terpasang; layer dan animasi akhir belum |
| P1        | Animasi menang 8 simbol + 3 animasi scatter                                                                                             | 11     | Sekarang hanya denyut kode                                        |
| P1        | Animasi panel (tumble, intro, outro), banner retrigger, 4 animasi perayaan                                                              | 9      | Panel sekarang muncul diam                                        |
| P1        | Ambien base dan free spins, kilau, debu                                                                                                 | 4      | Kehidupan di layar                                                |
| P2        | Latar portrait × 2, kilau logo                                                                                                          | 3      | Penyempurnaan                                                     |

**Pertanyaan terbuka**

- **Format animasi — diputuskan 30 Oktober 2026.** Animasi skeleton tanpa Spine Editor, diputar oleh runtime skeleton sendiri. Runtime Spine butuh lisensi Spine Editor, jadi spine sampel dipindahkan; `glint` sudah pindah ke [Kilara Skeleton](../../../packages/components-pixi/src/skeleton/README.md) pada hari yang sama. Partikel tetap boleh sprite sheet.
- **Gaya — diputuskan 30 Oktober 2026.** Kilap Jernih yang mengilap. Simbol pack v4 ("besi kusam") dibuat ulang dalam gaya ini sebelum dipecah untuk rig.
- **Warna tier Glint — diputuskan 30 Oktober 2026.** Tetap empat tier: toska → emas → jingga → magenta, seperti artwork sekarang.
- **Wild (W).** Masih dideklarasikan di math tapi tidak pernah muncul di reel. Hapus dari `game_config.py` agar aturan game tidak menyebut wild.
- **Resolusi simbol.** Runtime 256 × 256 perlu dicek di layar desktop terbesar. Kalau buram, ekspor 384 atau 512 dari master 1254 px.
- **Sumber gambar — diputuskan 30 Oktober 2026.** Image generation untuk gambar baru dan layer rig.
