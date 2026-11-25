# Arabic Quest — 3D Retro Adventure

Game edukasi Bahasa Arab untuk jenjang MTs dengan gameplay platformer 3D bergaya retro. Proyek ini memakai Three.js melalui CDN dan dapat di-host sebagai situs statis di Netlify.

## Fitur
- Dunia platformer 3D dengan kamera ortografis side-view.
- Karakter voxel, platform bata, bukit, awan, koin, musuh patroli, dan kastil.
- Lima blok misteri yang membuka kuis Bahasa Arab bertingkat.
- Jawaban benar memberi 1.000 poin dan satu koin; jawaban salah menampilkan pembahasan dan blok dapat dicoba kembali.
- Efek visual: fog, pencahayaan, bayangan, animasi koin, dan camera follow.
- Kontrol keyboard dan tombol layar sentuh.

## Menjalankan lokal
Karena menggunakan JavaScript module, jalankan melalui local server, bukan membuka `index.html` langsung. Contoh:

```bash
python -m http.server 8080
```

Lalu buka http://localhost:8080.

## Deploy ke GitHub dan Netlify
1. Ekstrak ZIP dan unggah seluruh isi folder ke root repository GitHub.
2. Di Netlify pilih **Add new site → Import an existing project**.
3. Pilih repository tersebut.
4. Build command: kosongkan.
5. Publish directory: `.`
6. Deploy.

## Catatan teknis
Three.js dimuat dari jsDelivr CDN, sehingga koneksi internet diperlukan saat game dijalankan. Efek “4D” di sini merupakan istilah pengalaman imersif (animasi, pencahayaan, fog, respons visual), bukan dimensi ruang keempat atau dukungan perangkat motion-seat/haptic khusus.
