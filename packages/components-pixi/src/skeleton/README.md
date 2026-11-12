# Kilara Skeleton

Runtime animasi cutout milik Kilara. Dibuat 30 Oktober 2026 setelah diputuskan bahwa animasi skeleton dikerjakan tanpa Spine Editor. Runtime Spine (`spine-pixi-v8`) hanya boleh dipakai pemegang lisensi Spine Editor, jadi animasi baru memakai format dan runtime ini.

> **Status (12 November 2026):** keputusan di atas di-reset pada 10 November 2026, dan saat ini tidak ada game yang memakai runtime ini; kodenya tetap disimpan. Dragon's Glint menggambar simbolnya dengan kode dan menganimasikan naganya dengan strip frame PNG ditambah lapisan gerak dari kode. Contoh di bawah (skeleton `glint`, skin `t2`, event `glint-primed`) berasal dari aset lama yang sudah dihapus; anggap hanya sebagai ilustrasi format.

- `skeleton.ts`: data, sampling, pose, matriks, validasi, dan `AnimationState`. Tidak bergantung pada Pixi atau Svelte, jadi bisa dijalankan skrip Node.
- `../components/Skeleton.svelte`: menggambar skeleton di Pixi, satu `Sprite` per slot.

## Format v1

Satu file JSON. Sumbu y ke bawah, rotasi dalam derajat searah jarum jam, waktu dalam detik.

```json
{
	"format": "kilara-skeleton",
	"version": 1,
	"name": "glint",
	"bounds": { "x": -50, "y": -50, "width": 100, "height": 100 },
	"bones": [{ "name": "root" }, { "name": "primed", "parent": "root", "x": 38, "y": -38 }],
	"slots": [{ "name": "primed", "bone": "primed", "attachment": "primed", "alpha": 0 }],
	"skins": {
		"default": { "primed": { "primed": { "texture": "glint-primed", "width": 22, "height": 22 } } }
	},
	"animations": {
		"prime": {
			"duration": 0.3,
			"bones": {
				"primed": {
					"scale": [
						[0, 0.45],
						[0.12, 1.18],
						[0.3, 1]
					]
				}
			},
			"slots": {
				"primed": {
					"alpha": [
						[0, 0],
						[0.1, 1]
					]
				}
			},
			"events": [[0.1, "spark"]]
		}
	}
}
```

| Bagian     | Aturan                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bounds`   | Kotak pose awal. Prop `width`/`height` komponen menskalakan kotak ini, seperti `SpineProvider`. Origin skeleton tetap di titik (0, 0)                                                                                                                                                                                                                          |
| `bones`    | `x`, `y`, `rotation`, `scaleX`, `scaleY` relatif ke parent. Parent harus tertulis lebih dulu                                                                                                                                                                                                                                                                   |
| `slots`    | Urutan gambar dari belakang ke depan. `alpha` awal, `blend` `normal` atau `add`, `attachment` awal atau `null`                                                                                                                                                                                                                                                 |
| `skins`    | `default` wajib. Skin lain hanya menimpa slot yang berbeda                                                                                                                                                                                                                                                                                                     |
| Attachment | `texture` adalah key di `loadedAssets` (frame dari sheet `sprites`). `width`/`height` adalah ukuran gambar di unit skeleton; `x`, `y`, `rotation`, `anchor` (bawaan tengah)                                                                                                                                                                                    |
| Key        | `[waktu, nilai]` atau `[waktu, nilai, ease]`. Ease berlaku dari key ini ke key berikutnya: `linear` (bawaan), `stepped`, `smooth`, `in`, `out`                                                                                                                                                                                                                 |
| Kanal bone | `x`, `y`, `rotation` ditambahkan ke pose awal; `scale`, `scaleX`, `scaleY` dikalikan                                                                                                                                                                                                                                                                           |
| Kanal slot | `alpha` mutlak; `attachment` berganti tanpa interpolasi                                                                                                                                                                                                                                                                                                        |
| `ik`       | Opsional. IK dua bone, diselesaikan berurutan setelah animasi: `{ name, bones: [atas, bawah], end, target, bend, orient? }`. Bone atas dan bawah diputar sampai origin `end` (anak bone bawah) jatuh di origin `target`. `bend` 1 atau -1 memilih sisi tekukan sendi; `orient` membuat `end` mengikuti rotasi dunia `target`, misalnya telapak yang tetap rata |
| `events`   | `[waktu, nama]`, diteruskan ke `onevent` sekali per putaran                                                                                                                                                                                                                                                                                                    |

Sebelum key pertama dan sesudah key terakhir, nilai key terdekat yang dipakai. Kanal yang tidak dianimasikan kembali ke pose awal. Animasi satu kali berhenti di frame terakhirnya.

`validateSkeleton(data)` mengembalikan daftar kesalahan: parent yang belum ditulis, slot atau skin yang kurang, rantai IK yang salah, dan key di luar durasi atau tidak urut. Jalankan sebelum file diserahkan.

## Komponen

```svelte
<Skeleton
	data={glintSkeleton}
	skin="t2"
	animation="light"
	loop={false}
	mix={0.14}
	timeScale={stateBetDerived.timeScale()}
	width={SYMBOL_SIZE * 0.94}
	oncomplete={finish}
	onevent={(name) => {}}
/>
```

- Mengganti `animation` memutar animasi itu dari awal. `mix` memberi cross-fade dari animasi sebelumnya.
- `oncomplete` dipanggil di akhir animasi satu kali, dan di akhir setiap putaran loop.
- Tekstur diambil dari `loadedAssets`. Daftarkan sheet-nya sebagai aset `sprites` agar setiap frame menjadi key.
- Reduced motion tetap urusan pemanggil: tampilkan sprite diam alih-alih skeleton.

Untuk skrip QA, display object-nya adalah `SkeletonContainer` dengan label `skeleton:<name>`. Container ini menyediakan `skin`, `animationState.current?.name`, `elapsed` (detik berjalan, tidak pernah kembali ke nol), dan `textureOf(slot)`.

## Belum ada

Mesh dan deformasi berbobot, constraint selain IK dua bone, urutan gambar per key, tint per key, dan lebih dari satu track.
