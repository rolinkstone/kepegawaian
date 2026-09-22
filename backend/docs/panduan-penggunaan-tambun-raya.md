# PANDUAN PENGGUNAAN APLIKASI
# TAMBUN RAYA

### Aplikasi Kepegawaian GAP Kompetensi

**Balai Besar Pengawasan Obat dan Makanan (BBPOM) di Palangka Raya**

Versi 1.0

---

## Daftar Isi

- BAB 1 - Pengenalan Aplikasi
- BAB 2 - Login, Navigasi, dan Logout
- BAB 3 - Panduan Role Admin Tambun Raya
- BAB 4 - Panduan Role Katim (Ketua Tim)
- BAB 5 - Panduan Role Pegawai (User)
- BAB 6 - Referensi Rinci Setiap Modul
- BAB 7 - Daftar Status dan Artinya
- BAB 8 - Aturan Penting yang Perlu Diketahui
- BAB 9 - Penanganan Masalah Umum

---

# BAB 1 - PENGENALAN APLIKASI

## 1.1 Apa itu TAMBUN RAYA

**TAMBUN RAYA** adalah aplikasi kepegawaian untuk **peta kompetensi (GAP Kompetensi)** aparatur BBPOM di Palangka Raya. Aplikasi ini dipakai untuk:

1. Menyusun **standar kompetensi** jabatan (jabatan x jenjang x kompetensi).
2. Memetakan **profil kompetensi pegawai**.
3. Memantau **pemenuhan kompetensi wajib** tiap pegawai setiap tahun.
4. Mengelola **pelatihan** (jadwal, undangan peserta, kehadiran, sertifikat).
5. Melakukan **verifikasi sertifikat/bukti kompetensi**.
6. Menyimpan **dokumen perencanaan** pengembangan kompetensi.

## 1.2 Daftar Role dan Hak Akses

Aplikasi ini digunakan oleh **tiga role** berikut:

| Role (Keycloak) | Sebutan di aplikasi | Hak akses utama |
| --- | --- | --- |
| `admin_tambun_raya` | **Admin Tambun Raya** | Akses penuh: kelola seluruh master data, data pegawai, kompetensi wajib, jadwal & master pelatihan, **verifikasi sertifikat**, perencanaan, serta melihat semua data pemenuhan |
| `katim` | **Ketua Tim** | View-only pada master data & pegawai; dapat **membuat & mengelola jadwal pelatihan**, mengundang peserta, publikasi, ubah kehadiran, tandai kompetensi terpenuhi, **Pantau Sertifikat**, kelola **Perencanaan**, serta lihat & hapus **Riwayat Pelatihan** pegawai |
| `user` | **Pegawai** | Melihat **data kompetensinya sendiri**, menerima undangan pelatihan, dan mengunggah sertifikat kompetensi |

**Catatan:** role ditetapkan pada server Keycloak, bukan di dalam aplikasi. Bila role Anda belum sesuai, hubungi administrator.

## 1.3 Peta Menu (Sidebar) per Role

| Grup Menu | Menu | Route | Muncul untuk |
| --- | --- | --- | --- |
| Home | **Beranda** | `/` | Semua |
| Peta Kompetensi | **Reference** | `/master` | Semua (tulis hanya Admin Tambun Raya) |
| Peta Kompetensi | **Standar Kompetensi** | `/standar_kompetensi` | Semua (hanya baca) |
| Perencanaan | **Perencanaan** | `/perencanaan` | **Admin Tambun Raya dan Katim** |
| Profil | **Profil Kompetensi** | `/pegawai` | Semua (kelola hanya Admin Tambun Raya) |
| Profil | **Pemenuhan per Peran** | `/pegawai/peran` | Semua |
| Profil | **Pemenuhan per Kompetensi** | `/pegawai/kompetensi` | Semua |
| Pemenuhan Kompetensi | **Jadwal Pelatihan** | `/pelatihan` | Semua |
| Pemenuhan Kompetensi | **Riwayat Pelatihan** | `/users_kompetensi` | Semua |

---

# BAB 2 - LOGIN, NAVIGASI, DAN LOGOUT

## 2.1 Cara Login

1. Buka alamat aplikasi di peramban (browser).
2. Halaman **Login** akan terbuka.
3. Klik tombol **Login dengan SSO** dengan subteks "Akun terverifikasi BBPOM Palangka Raya".
4. Tombol berubah menjadi **Mengarahkan ke Portal SSO** - Anda dialihkan ke halaman **Keycloak**.
5. Masukkan **username** dan **password** akun BBPOM Anda, lalu masuk.
6. Setelah berhasil, Anda otomatis kembali ke halaman **Beranda**.

**Penting:**

- Aplikasi **tidak menyediakan form username/password sendiri**. Seluruh proses login dilakukan di portal SSO Keycloak.
- Masa berlaku sesi adalah **4 jam**. Setelah itu Anda akan diminta login kembali.
- Di halaman login juga tersedia tombol **Tentang Sistem** (penjelasan TAMBUN RAYA, tujuan, manfaat, fitur utama) dan tautan **Download Panduan**.

## 2.2 Pesan Error Saat Login

| Pesan | Artinya |
| --- | --- |
| "Akses ditolak. Periksa kredensial Anda atau hubungi administrator." | Username/password salah atau akun tidak diizinkan |
| "Terdapat masalah dengan konfigurasi server." | Masalah konfigurasi SSO, hubungi administrator |
| "Link verifikasi tidak valid atau telah kadaluarsa." | Tautan verifikasi sudah lewat masa berlaku |
| "Terjadi kesalahan saat autentikasi. Silakan coba lagi." | Gangguan umum |
| "Gagal memulai login SSO. Silakan coba lagi." | Koneksi ke portal SSO gagal |

## 2.3 Mengenal Tampilan Setelah Login

- **Sidebar kiri:** berisi menu yang dikelompokkan (Home, Peta Kompetensi, Perencanaan, Profil, Pemenuhan Kompetensi). Klik ikon menu di kiri atas untuk menyembunyikan/menampilkan sidebar.
  - Menu yang sedang aktif ditandai warna **biru**.
- **Header atas:** judul halaman (di Beranda tertulis **Dashboard**, di halaman lain **Aplikasi Kepegawaian GAP Kompetensi**), ikon lonceng, nama Anda, badge role, dan avatar inisial.
- **Footer sidebar:** Kartu nama + email, dan tombol **Logout**.

## 2.4 Logout

1. Klik **Logout** di bagian bawah sidebar.
2. Tombol berubah menjadi **Logging out...** (proses sedang berjalan).
3. Aplikasi menghapus sesi aplikasi **dan** sesi SSO Keycloak, lalu mengarahkan Anda ke halaman Login.

Catatan: jika Anda hanya menutup tab tanpa logout, sesi SSO Anda masih aktif selama masa berlaku sesi.

---

# BAB 3 - PANDUAN ROLE ADMIN TAMBUN RAYA

Role **Admin Tambun Raya** adalah role dengan kewenangan penuh. Urutan kerja yang disarankan di bawah ini sudah mengikuti ketergantungan antar-data (master dulu, baru pegawai, baru pelatihan, terakhir verifikasi dan pelaporan).

## Langkah 1 - Mengisi Master Data (menu Reference)

Buka menu **Reference**. Halaman berjudul **Master Data Kepegawaian** dengan 5 tab. Isi dengan urutan berikut.

**1. Tab Jabatan**

- Klik **Tambah Jabatan**.
- Isi **Nama Jabatan** (wajib), lalu **Simpan**.
- Untuk mengubah/menghapus: gunakan ikon **Edit** / **Hapus** pada kolom Aksi.

**2. Tab Jenjang**

- Klik **Tambah Jenjang**.
- Isi **Nama Jenjang** (contoh: Ahli Pertama, Ahli Muda).
- Pilih **Tingkat**:
  - Universal / Tanpa Tingkat (0)
  - Tingkat 1 - Ahli Pertama
  - Tingkat 2 - Ahli Muda
  - Tingkat 3 - Ahli Madya
  - Tingkat 4 - Ahli Utama
- Klik **Simpan**. Tingkat dipakai untuk menentukan urutan jenjang dan reuse kompetensi.

**3. Tab Fungsi**

- Klik **Tambah Fungsi**, isi **Nama Fungsi** (wajib), lalu **Simpan**.

**4. Tab Peran**

- Klik **Tambah Peran**.
- Pilih **Fungsi** (wajib).
- Isi **Nama Peran** (contoh: Penguji, Pemeriksa, Auditor Internal).
- Aktifkan switch **Lintas Fungsi** bila peran ini harus muncul di semua fungsi (contoh: BMN).
- Klik **Simpan**.
- Gunakan **Filter Fungsi** untuk menyaring daftar peran.

**5. Tab Kompetensi** (tab terpenting)

- Klik **Tambah Kompetensi**, lalu isi:
  1. **Kode Kompetensi** (wajib - contoh: K001, P001, A001)
  2. **Fungsi** (wajib)
  3. **Peran Default** (wajib - hanya menampilkan peran dari fungsi terpilih + peran lintas fungsi; **tidak bisa diubah saat mode Edit**)
  4. **Nama Kompetensi** (wajib)
  5. **Deskripsi (Opsional)**
- Pada bagian **Mapping Jabatan, Jenjang & Peran**:
  - Klik **Tambah Mapping**, lalu pilih **Jabatan**, **Jenjang**, **Peran**, dan centang **Wajib** bila kompetensi ini wajib untuk kombinasi tersebut.
  - Atau klik **Mapping ke Semua** untuk memetakan ke seluruh jabatan & jenjang (butuh Fungsi dan Peran Default sudah terisi).
  - Klik **Kosongkan** untuk menghapus seluruh baris mapping.
- Klik **Simpan**.
- Setelah tersimpan, gunakan tombol **Lihat** atau **Atur Mapping** di kolom **Mapping** untuk memeriksa/menyesuaikan mapping. Muncul modal **Lihat Mapping Kompetensi** / **Atur Mapping Kompetensi** yang menampilkan tabel No | Jabatan | Jenjang | Tingkat | Status | Aksi, lengkap dengan blok **Mapping ke Semua** dan catatan "Satu kompetensi dapat digunakan di beberapa jenjang (reuse kompetensi)".

Jika Anda bukan Admin Tambun Raya, seluruh tombol tulis **Tambah/Edit/Hapus** pada halaman ini akan berstatus nonaktif dan tabel menampilkan label **Mode Baca**.

## Langkah 2 - Mengisi Data Pegawai (menu Profil Kompetensi)

1. Buka menu **Profil Kompetensi**, halaman **Manajemen Pegawai**.
2. Klik **Tambah Pegawai** (hanya aktif untuk Admin Tambun Raya).
3. Isi form **Tambah Pegawai Baru**:

| Field | Keterangan |
| --- | --- |
| **NIP** | Wajib, **harus 18 digit angka** |
| **Nama Lengkap** | Wajib |
| **Fungsi** | Wajib - pilih dari daftar |
| **Jabatan** | Wajib |
| **Jenjang** | Wajib |
| **Peran** | Wajib minimal 1, bisa lebih dari satu (dikelompokkan per fungsi) |
| **Email** | Opsional, harus format email yang benar |
| **No. HP** | Opsional |
| **Tanggal Bergabung** | Opsional |
| **Status** | Switch Aktif/Tidak Aktif - hanya muncul saat **Edit** |

4. Klik **Simpan** - muncul pesan "Pegawai berhasil ditambahkan".
5. Untuk memperbaiki data: klik ikon **Edit** lalu **Simpan Perubahan**.
6. Untuk menonaktifkan: klik ikon **Nonaktifkan**, lalu konfirmasi **Ya, Nonaktifkan**. Pegawai yang dinonaktifkan tidak akan muncul dalam daftar aktif.
7. Untuk mengaktifkan kembali: klik **Aktifkan** pada pegawai non-aktif.
8. Gunakan **Export Data**, **Cetak**, dan **Refresh Data** pada header halaman.

**Analisis Kenaikan Jenjang:** klik ikon grafik pada baris pegawai, lalu modal **Analisis Kenaikan Jenjang** akan menampilkan:

- **Informasi Pegawai** (Nama, NIP, Jabatan, Jenjang Saat Ini, Fungsi, Peran)
- Filter **Pilih Fungsi** dan **Pilih Target Jenjang**
- Kartu **Informasi Peran** (Peran Dimiliki / Peran Tidak Dimiliki / Total Peran)
- Statistik **Target Jenjang**, **Total Kompetensi**, **MEMENUHI**, **TIDAK MEMENUHI** beserta progress bar
- Tabel per kompetensi dengan kolom pemenuhan (V = memenuhi, X = tidak memenuhi)

Modal ini bersifat **hanya-baca** (tidak menyimpan data apa pun).

## Langkah 3 - Memastikan Standar Kompetensi (menu Standar Kompetensi)

Halaman ini adalah hasil gabungan dari mapping kompetensi (satu baris = satu kombinasi kompetensi x jabatan x jenjang). Gunakan untuk **memeriksa** apakah peta kompetensi sudah benar.

- Tab **Daftar Kompetensi**: mencari & menyaring data (Cari kode/nama/deskripsi, Filter Jabatan, Filter Jenjang, Filter Tingkat, Filter Fungsi, Filter Peran), melihat detail lewat tombol **Lihat Detail**, memilih beberapa baris lalu klik **Export Selected (n)**.
- Tab **Statistik**: rekap per Jenjang / Jabatan / Fungsi.
- Tombol **Refresh Data**, **Export Data** (Excel/PDF), dan **Cetak**.
- Halaman ini **tidak memiliki fitur tambah/ubah/hapus**.

## Langkah 4 - Menetapkan Kompetensi Wajib Tahunan (menu Jadwal Pelatihan > tab Kompetensi Wajib)

1. Buka menu **Jadwal Pelatihan**.
2. Klik tab **Kompetensi Wajib** dengan subjudul "Daftar kompetensi yang wajib dipenuhi oleh pegawai setiap tahunnya".
3. Pilih **Tahun** pada dropdown, lalu klik **Refresh**.
4. Klik **Tambah Kompetensi Wajib**.
5. Pada form **Tambah Kompetensi Wajib**:
   - Pilih **Tahun** (daftar 2020-2030, default tahun berjalan).
   - Cari **Kompetensi** (berdasarkan kode/nama), lalu centang kompetensi yang wajib.
   - Gunakan **Select All / Deselect All** untuk memilih/menghapus semua centang sekaligus. Teks **Terpilih: N kompetensi** menunjukkan jumlah pilihan.
6. Klik **Simpan**. Kompetensi yang sudah pernah ditetapkan pada tahun tersebut akan otomatis diabaikan (skipped).
7. Untuk menghapus seluruh penetapan satu tahun: klik **Hapus Semua {tahun}**.
8. Kartu ringkasan menampilkan **Total Kompetensi Wajib**, **Tahun Aktif**, dan **Status** (Aktif / Lampau / Mendatang).

Kompetensi wajib inilah yang muncul sebagai daftar tugas di **Beranda** pegawai dan dipakai menghitung persentase pemenuhan 100%.

## Langkah 5 - Membuat Master Pelatihan (menu Jadwal Pelatihan > tab Master Pelatihan)

1. Buka tab **Master Pelatihan**.
2. Klik **Buat Master Pelatihan**.
3. Isi form:

| Field | Keterangan |
| --- | --- |
| **Kode Pelatihan** | Wajib - contoh: TEK-001 |
| **Nama Pelatihan** | Wajib - contoh: Pengujian Menggunakan HPLC |
| **Deskripsi** | Opsional |
| **Jenis Pelatihan** | Teknis / Manajerial / Sertifikasi / Umum (default: Teknis) |
| **Durasi (jam)** | Angka, minimal 1 |
| **Biaya (Rp)** | Angka, minimal 0 |
| **Kompetensi yang Terkait** | Bisa lebih dari satu - kompetensi inilah yang nanti dihubungkan dengan peserta |

4. Klik **Simpan**.
5. Kolom **Status** menampilkan badge **Aktif** / **Tidak Aktif**.
6. Gunakan ikon **Edit** / **Hapus** untuk mengelola data.

## Langkah 6 - Membuat Jadwal Pelatihan

1. Buka tab **Jadwal Pelatihan**, lalu klik **Buat Jadwal Pelatihan**.
2. Isi form **Buat Jadwal Pelatihan Baru**:

| Field | Wajib? | Keterangan |
| --- | --- | --- |
| **Nama Pelatihan** | Ya | Pilih dari Master Pelatihan (kode - nama (jenis)) |
| **Nama Penyelenggara** | Tidak | Teks bebas, contoh: BBPOM, Lembaga Diklat |
| **Penyelenggara (Pegawai)** | Ya | **Hanya muncul** bila akun Admin Anda tidak terdaftar sebagai data pegawai - pilih pegawai penyelenggara |
| **Tanggal Mulai** | Ya | Tidak boleh melebihi Tanggal Selesai |
| **Tanggal Selesai** | Ya | Tidak boleh lebih awal dari Tanggal Mulai |
| **Waktu Mulai / Waktu Selesai** | Tidak | |
| **Lokasi** | Tidak | Contoh: Ruang Meeting, Zoom Meeting |
| **Metode** | Tidak | Offline / Online / Hybrid (default: Offline) |
| **Kuota Peserta** | Tidak | Kosongkan bila tidak terbatas |
| **Deskripsi / Catatan** | Tidak | |
| **Undang Peserta (Opsional)** | Tidak | Pilih beberapa pegawai sekaligus saat membuat jadwal |

3. Klik **Simpan**. Jadwal baru tersimpan dengan status **Draft**.
4. Kartu statistik di atas tabel menampilkan **Total Jadwal**, **Draft**, **Publik**, dan **Selesai**.

## Langkah 7 - Mengundang Peserta

Anda bisa mengundang peserta dengan dua cara:

**Cara A - dari tabel jadwal**

- Klik tombol **Undang Peserta** pada baris jadwal (hanya tersedia saat status **Draft** atau **Publik**).

**Cara B - dari Detail Jadwal**

- Klik ikon **Detail**, buka tab **Informasi Pelatihan**, lalu klik **Undang Peserta** (tersedia saat status **Draft**).

Pada modal **Undang Peserta - {nama pelatihan}**:

1. Ketik pada **Cari Pegawai** (berdasarkan nama, NIP, atau fungsi).
2. Pilih peserta pada **Pilih Peserta** (tekan Ctrl/Cmd untuk memilih lebih dari satu).
3. Klik **Undang Peserta**.

Setiap peserta tercatat dengan status undangan **Pending**. Saat jadwal masih **Draft**, jadwal belum terlihat oleh pegawai dan undangan belum dapat dikonfirmasi.

## Langkah 8 - Mempublikasikan Jadwal

1. Klik ikon **Publikasi** pada baris jadwal (hanya tersedia saat status **Draft**).
2. Konfirmasi **Ya, Publikasi**.
3. Status jadwal berubah menjadi **Publik** - sekarang jadwal tampil pada daftar pegawai yang diundang dan undangan dapat diterima/ditolak.

## Langkah 9 - Menjalankan dan Menyelesaikan Pelatihan

1. Saat pelatihan dimulai, klik tombol **Mulai** (status **Publik** menjadi **Berlangsung**). Konfirmasi **Ya, Berlangsung**.
2. Selama status **Berlangsung**/**Selesai**, buka **Detail** jadwal, pilih tab **Daftar Peserta (N)**, lalu ubah **Kehadiran** tiap peserta melalui dropdown: Pilih Kehadiran, **Hadir**, **Tidak Hadir**, **Izin**, **Sakit**.
3. Setelah pelatihan usai, klik tombol **Selesai** (status **Berlangsung** menjadi **Selesai**). Konfirmasi **Ya, Selesai**.
4. Pada status **Selesai**, klik tombol **Kompetensi Terpenuhi** pada baris peserta, lalu muncul modal **Kompetensi Terpenuhi** dengan field **Pilih Kompetensi yang Terpenuhi** (hanya kompetensi yang terkait jadwal). Klik **Simpan**.
5. Jalankan pelatihan lain dengan pola yang sama.

**Urutan status jadwal yang benar:**

```
Draft -> Publik -> Berlangsung -> Selesai
                 -> Dibatalkan (dari Publik/Berlangsung)
```

## Langkah 10 - Memverifikasi Sertifikat/Bukti Kompetensi

Verifikasi adalah kewenangan **eksklusif Admin Tambun Raya**.

1. Buka menu **Riwayat Pelatihan**.
2. Cari data yang statusnya **Belum Diverifikasi** - gunakan filter **Hasil Verifikasi** lalu pilih **Belum Diverifikasi**.
3. Klik ikon **Verifikasi** pada baris data.
4. Pada modal **Verifikasi Kompetensi**:
   - Periksa blok read-only: **Informasi Pegawai**, **Informasi Kompetensi**, dan **Verifikasi Sebelumnya** (bila pernah diverifikasi).
   - Isi **Status Verifikasi** (wajib): **Lulus** / **Tidak Lulus** / **Dalam Proses**.
   - Isi **Hasil Verifikasi** (wajib): **Valid** / **Tidak Valid** / **Perlu Revisi**.
   - Isi **Keterangan** (opsional).
   - Nama Anda otomatis tercatat sebagai verifikator pada blok **Verifikator (Admin yang Login)** dan **Ringkasan Verifikasi**.
5. Klik **Verifikasi**.

**Arti hasil:**

- **Lulus + Valid** - kompetensi dinyatakan **SUDAH MEMENUHI** dan ikut dihitung pada dashboard, pemenuhan peran, dan pemenuhan per kompetensi.
- **Lulus + belum Valid** - berstatus **Menunggu Verifikasi**.
- **Tidak Valid** / **Perlu Revisi** - pegawai masih boleh memperbaiki datanya (mengunggah ulang). Saat pegawai memperbaiki data, hasil verifikasi lama otomatis direset menjadi **Belum Diverifikasi**.
- Data yang sudah **Valid** tidak dapat diedit lagi oleh pegawai.

## Langkah 11 - Memantau Kelengkapan Sertifikat Peserta

1. Buka menu **Jadwal Pelatihan**.
2. Pada jadwal berstatus **Selesai**, klik tombol **Pantau**.
3. Modal **Pantau Sertifikat Peserta** menampilkan:
   - Kartu ringkasan: **Total Peserta (Diterima)**, **Upload Kompetensi**, **Peserta Lengkap**, **Peserta Belum Lengkap**.
   - Tabel dengan kolom **No**, **Peserta** (nama, NIP, fungsi dan jabatan), **Kehadiran**, **Sertifikat per Kompetensi** (ikon centang/silang, badge Verif: Valid / Tidak Valid / Perlu Revisi, tombol **Lihat**, atau teks "Belum upload"), dan **Status**.
   - Badge status peserta: **Lengkap (n/m)**, **Belum Lengkap (n/m)**, atau **Tanpa Kompetensi**.
4. Gunakan informasi ini untuk mengingatkan peserta yang belum mengunggah sertifikat.

## Langkah 12 - Mengelola Dokumen Perencanaan

1. Buka menu **Perencanaan** (judul halaman **Perencanaan**, subjudul "Dokumen perencanaan Pengembangan Kompetensi").
2. Klik **Upload Dokumen**.
3. Pada modal **Upload Dokumen Perencanaan**:
   - Isi **Judul / Nama Dokumen** (opsional; jika dikosongkan memakai nama file).
   - Pilih **File PDF** (wajib) - hanya PDF, **maksimal 20 MB**.
4. Klik **Upload**.
5. Pada tabel dokumen: gunakan **Lihat** (pratinjau langsung), **Download**, atau **Hapus** (konfirmasi **Ya, Hapus**).
6. Kotak **Cari nama file atau pengunggah...** menyaring daftar dokumen.

Dokumen hanya bisa dihapus oleh yang mengunggahnya atau oleh Admin Tambun Raya.

## Langkah 13 - Mencetak Laporan Pemenuhan

Gunakan dua halaman ini sebagai bahan laporan; keduanya punya tombol **Export** (CSV):

1. **Pemenuhan per Peran** - klik **Detail** pada sebuah peran, lihat statistik **Total Pegawai**, **Sudah Memenuhi**, **Belum Memenuhi**, **Persentase**, lalu klik **Export**.
2. **Pemenuhan per Kompetensi** - klik **Detail** pada sebuah kompetensi, lihat daftar **Pemilik Sertifikat** (status Lulus & Valid), lalu klik **Export**.

## Ringkasan Kewenangan Admin Tambun Raya

| Aktivitas | Boleh? |
| --- | --- |
| Tambah/Edit/Hapus Jabatan, Jenjang, Fungsi, Peran, Kompetensi & Mapping | Ya |
| Tambah/Edit/Nonaktifkan pegawai | Ya |
| Analisis Kenaikan Jenjang pegawai | Ya |
| Menetapkan & menghapus Kompetensi Wajib tahunan | Ya |
| Membuat/Edit/Hapus Master Pelatihan | Ya |
| Membuat/Edit/Hapus jadwal pelatihan (semua status) | Ya |
| Undang peserta, publikasi, mulai, selesaikan, ubah kehadiran | Ya |
| Memverifikasi sertifikat | Ya (hanya role ini) |
| Pantau Sertifikat Peserta | Ya |
| Upload/Hapus dokumen Perencanaan | Ya |

---

# BAB 4 - PANDUAN ROLE KATIM (Ketua Tim)

Role **Katim** menangani **operasional pelatihan** dan **perencanaan**. Master data dan data pegawai hanya bisa dilihat (view-only).

## 4.1 Yang Bisa Dilakukan Katim

| Aktivitas | Boleh? | Catatan |
| --- | --- | --- |
| Melihat seluruh master data | Ya | Tabel berlabel **Mode Baca**, tombol tulis nonaktif |
| Melihat seluruh data pegawai | Ya | Mode "Ketua Tim (View Only)" |
| Tambah/Edit/Nonaktifkan pegawai | Tidak | Hanya Admin Tambun Raya |
| Membuat & mengubah jadwal pelatihan | Ya | |
| Mengundang peserta, publikasi jadwal | Ya | |
| Mulai / Selesaikan pelatihan, ubah kehadiran | Ya | |
| Menandai **Kompetensi Terpenuhi** | Ya | |
| **Pantau Sertifikat Peserta** | Ya | Hanya pada jadwal **Selesai** |
| Menghapus jadwal pelatihan | Ya | **Hanya status Draft** |
| Menu **Perencanaan** (upload/hapus dokumen) | Ya | |
| Melihat semua **Riwayat Pelatihan** pegawai | Ya | |
| Menghapus data Riwayat Pelatihan | Ya | |
| **Memverifikasi sertifikat** | Tidak | Hanya Admin Tambun Raya |
| Menetapkan Kompetensi Wajib | Tidak | Hanya Admin Tambun Raya |
| Mencetak **Pemenuhan per Peran / per Kompetensi** | Ya | Termasuk **Export** CSV |

## 4.2 Langkah Kerja Katim

**A. Menyiapkan pelatihan untuk tim Anda**

1. Buka **Jadwal Pelatihan**, lalu klik **Buat Jadwal Pelatihan**.
2. Isi form jadwal (Nama Pelatihan, Tanggal Mulai/Selesai, Waktu, Lokasi, Metode, Kuota, Deskripsi). Penyelenggara otomatis tercatat sebagai Anda.
3. Klik **Simpan** - jadwal berstatus **Draft**.
4. Klik **Undang Peserta** pada baris jadwal, cari pegawai, pilih peserta, lalu klik **Undang Peserta**.
5. Klik ikon **Publikasi**, lalu konfirmasi **Ya, Publikasi**.
6. Saat hari pelaksanaan: klik **Mulai**.
7. Selama pelatihan: buka **Detail**, pilih tab **Daftar Peserta (N)**, lalu atur **Kehadiran** (Hadir / Tidak Hadir / Izin / Sakit).
8. Setelah selesai: klik **Selesai**.
9. Klik **Kompetensi Terpenuhi** pada tiap peserta, pilih kompetensi, lalu **Simpan**.
10. Klik **Pantau** untuk melihat peserta mana yang belum mengunggah sertifikat.

**B. Melihat rekap untuk laporan**

1. Buka **Pemenuhan per Peran**, pilih peran, lalu **Detail** dan **Export**.
2. Buka **Pemenuhan per Kompetensi**, pilih kompetensi, lalu **Detail** dan **Export**.

**C. Mengelola dokumen perencanaan**

1. Buka **Perencanaan**, klik **Upload Dokumen**, pilih PDF (maks 20 MB), lalu **Upload**.
2. Gunakan **Lihat**, **Download**, atau **Hapus** sesuai kebutuhan.

**D. Merespons undangan untuk diri sendiri**

- Bila Anda mengundang diri sendiri sebagai peserta, buka **Detail** jadwal, masuk ke tab peserta, lalu klik **Terima Undangan** atau **Tolak Undangan**.

---

# BAB 5 - PANDUAN ROLE PEGAWAI (User)

Role **Pegawai** berfokus pada **kompetensi diri sendiri** dan **undangan pelatihan**.

## 5.1 Yang Bisa Dilakukan Pegawai

| Aktivitas | Boleh? |
| --- | --- |
| Melihat **Beranda** pribadi (kompetensi wajib, progress, grafik) | Ya |
| Melihat **Reference** & **Standar Kompetensi** (baca saja) | Ya |
| Melihat **Profil Kompetensi** - **hanya data diri sendiri** | Ya |
| **Pemenuhan per Peran** & **Pemenuhan per Kompetensi** (data semua pegawai) | Ya |
| Menerima/menolak **undangan pelatihan** | Ya |
| Menambah kompetensi & **mengunggah sertifikat** di **Riwayat Pelatihan** | Ya (untuk dirinya sendiri) |
| Mengedit data kompetensinya sendiri | Ya - **kecuali** yang sudah berstatus **Valid** |
| Memverifikasi sertifikat | Tidak |
| Menghapus data kompetensi | Tidak |
| Mengelola master data & data pegawai | Tidak |
| Menu **Perencanaan** | Tidak |

## 5.2 Langkah 1 - Memeriksa Tugas Kompetensi di Beranda

Saat login, **Beranda** menampilkan:

- **"Selamat Datang, {nama}!"** beserta NIP, jabatan, fungsi, peran, dan **Login Terakhir**.
- Kartu statistik pribadi: **Kompetensi Wajib**, **Sudah Dipenuhi**, **Belum Dipenuhi**, **Undangan Pelatihan**.
- Banner **"Kompetensi wajib yang harus Anda penuhi"** - daftar kompetensi wajib yang belum dipenuhi (ditandai tag **WAJIB**). Klik **+ Tambah/Upload Kompetensi** untuk langsung menambah data, atau **Cari Pelatihan**.
- Bila semua sudah terpenuhi, muncul banner **"Selamat! Semua Kompetensi Wajib Terpenuhi"**.
- Banner **"Anda memiliki X undangan pelatihan yang perlu dikonfirmasi"** bila ada undangan baru, dengan tautan **Lihat undangan sekarang**.
- Section **Profil Kompetensi Anda**: progress pemenuhan (%), 5 kotak ringkasan (**Kompetensi Wajib**, **Sudah Dipenuhi**, **Belum Dipenuhi**, **Dalam Proses**, **Total Kompetensi**), daftar **Kompetensi Wajib yang Perlu Dipenuhi**, dan **Semua Kompetensi Anda** (klik **Lihat Semua** untuk menampilkan seluruhnya).
- Grafik: **Status Kompetensi**, **Tren Pelatihan per Bulan**, **Master Pelatihan per Jenis**, **Kompetensi per Fungsi**, **Status Pelatihan**.

Data pada Beranda **diperbarui otomatis setiap 30 detik**, saat Anda kembali ke tab, dan saat koneksi kembali online.

## 5.3 Langkah 2 - Menambah Kompetensi & Mengunggah Sertifikat

1. Buka menu **Riwayat Pelatihan** (halaman **Manajemen Kompetensi Pegawai**).
2. Klik **Tambah Kompetensi**.
3. Isi form **Tambah Kompetensi Pegawai**:

| Field | Keterangan |
| --- | --- |
| **Pilih Pegawai** | **Tidak muncul untuk pegawai** - otomatis terisi nama Anda |
| **Kompetensi** | Wajib - cari berdasarkan nama/kode/fungsi |
| **Tanggal Dipenuhi** | Wajib |
| **Nilai (0-100)** | Opsional (boleh desimal) |
| **Status** | Dalam Proses (default) / Lulus / Tidak Lulus |
| **Upload Sertifikat/Bukti** | Opsional - PDF, JPG, JPEG, atau PNG, **maksimal 2 MB** |

4. Klik **Simpan**.
5. Data masuk dengan status **Belum Diverifikasi** dan menunggu tindakan Admin Tambun Raya.

**Memperbaiki data yang ditolak:**

- Jika hasil verifikasi **Tidak Valid** atau **Perlu Revisi**, Anda boleh klik **Edit** pada baris data tersebut, memperbaiki isian/unggahan, lalu **Update**. Catatan verifikasi lama otomatis dihapus dan data kembali **Belum Diverifikasi**.
- Data yang sudah **Valid** tidak bisa diedit (tombol **Edit** nonaktif).

## 5.4 Langkah 3 - Menerima Undangan Pelatihan

1. Buka menu **Jadwal Pelatihan**. Yang tampil di sini hanya jadwal yang **mengundang Anda**; kolom **Peserta** menampilkan badge "Undangan: {status}" pada baris Anda.
2. Klik ikon **Detail** pada baris jadwal.
3. Buka tab **Status Undangan Saya (N)**.
4. Klik **Terima Undangan** atau **Tolak Undangan**.

Tombol hanya muncul bila jadwal sudah **dipublikasikan** (bukan Draft) dan status undangan Anda masih **Pending**.

## 5.5 Langkah 4 - Memantau Status Verifikasi

Buka **Riwayat Pelatihan** dan perhatikan kolom:

- **Status / Hasil** - badge status (Lulus / Tidak Lulus / Dalam Proses) dan badge hasil verifikasi (Belum Diverifikasi / Valid / Tidak Valid / Perlu Revisi).
- **Sertifikat** - teks **Lihat** untuk membuka/mengunduh file yang Anda unggah.
- **Verifikator** - nama admin yang memverifikasi beserta tanggalnya, atau teks "Belum diverifikasi".

Gunakan filter **Hasil Verifikasi** untuk menyaring data yang perlu perhatian.

## 5.6 Langkah 5 - Melihat Peluang & Pemenuhan

1. **Pemenuhan per Peran** - pilih peran Anda, klik **Detail**, lihat kompetensi wajib peran tersebut dan status **Dipenuhi / Belum** pada baris yang bisa diperluas.
2. **Pemenuhan per Kompetensi** - lihat siapa saja **Pemilik Sertifikat** pada suatu kompetensi (misalnya PPNS atau PBJ).
3. **Standar Kompetensi** - lihat kompetensi apa saja yang disyaratkan untuk suatu jabatan/jenjang.

---

# BAB 6 - REFERENSI RINCI SETIAP MODUL

## 6.1 Beranda

**Route:** `/`

| Bagian | Isi |
| --- | --- |
| Header | "Selamat Datang, {nama}!", badge role, nama instansi, NIP + jabatan, fungsi + peran, **Login Terakhir** |
| Banner Admin Tambun Raya/Katim | **"Pegawai yang belum 100% memenuhi kompetensi wajib"** - per pegawai: persentase, jumlah dipenuhi/total, progress bar, daftar kompetensi yang belum, tautan **Lihat semua kompetensi** dan **Rekomendasi Pelatihan**, tombol **Kelola Semua Pegawai** |
| Banner Admin Tambun Raya/Katim | **"Kompetensi yang harus diverifikasi"** - daftar pegawai dengan kompetensi Menunggu, tautan **Verifikasi sekarang**, tombol **Kelola Semua Verifikasi** |
| Banner pegawai | **"Kompetensi wajib yang harus Anda penuhi"** dengan tombol **+ Tambah/Upload Kompetensi** dan tautan **Cari Pelatihan** |
| Banner pegawai | **"Selamat! Semua Kompetensi Wajib Terpenuhi"** |
| Banner undangan | **"Anda memiliki X undangan pelatihan yang perlu dikonfirmasi"** (semua role) |
| Kartu Admin Tambun Raya/Katim | **Total Pegawai** - **Belum 100% Kompetensi Wajib** - **Menunggu Verifikasi** - **Jadwal Pelatihan** |
| Kartu pegawai | **Kompetensi Wajib** - **Sudah Dipenuhi** - **Belum Dipenuhi** - **Undangan Pelatihan** |

## 6.2 Reference / Master Data

**Route:** `/master`

**Judul:** Master Data Kepegawaian - "Kelola data jabatan, jenjang, fungsi, peran, dan kompetensi"

**Kartu statistik:** Total Jabatan - Total Jenjang - Total Fungsi - Total Peran - Total Kompetensi

**Tab dan kolom tabel:**

| Tab | Kolom |
| --- | --- |
| **Jabatan** | ID - Nama Jabatan - Tanggal Dibuat - Aksi |
| **Jenjang** | ID - Nama Jenjang - Tingkat - Tanggal Dibuat - Aksi |
| **Fungsi** | ID - Nama Fungsi - Tanggal Dibuat - Aksi |
| **Peran** | ID - Nama Peran - Fungsi - Tanggal Dibuat - Aksi (plus Filter Fungsi & Reset) |
| **Kompetensi** | Kode - Nama Kompetensi - Fungsi - Peran - Mapping - Aksi (plus Filter Fungsi, Filter Peran, Cari Kompetensi, Reset Filter) |

**Tombol:** Tambah Jabatan / Tambah Jenjang / Tambah Fungsi / Tambah Peran / Tambah Kompetensi, **Refresh Data**.

**Pagination tab Kompetensi:** 5 / 10 / 25 / 50 / 100 baris.

**Aksi per baris:** Edit, Hapus, dan khusus Kompetensi: Lihat Detail Mapping serta Atur Mapping.

Catatan: tombol **Export Data** pada tab Kompetensi belum berfungsi.

## 6.3 Standar Kompetensi

**Route:** `/standar_kompetensi`

**Judul:** Standar Kompetensi - "Kelola dan monitoring standar kompetensi pegawai"

- **Kartu:** Total Mapping - Jabatan - Jenjang - Fungsi
- **Tab:** **Daftar Kompetensi** (badge jumlah baris) dan **Statistik**
- **Filter:** Cari kode/nama/deskripsi - Filter Jabatan - Filter Jenjang - Filter Tingkat (Semua Tingkat, Ahli Pertama (Level 1), Ahli Muda (Level 2), Ahli Madya (Level 3), Universal (Level 0)) - tombol **Cari**, **Reset**, dan **Lanjutan/Sembunyikan** (panel: Filter Fungsi, Filter Peran, Total Data, badge **Filter Aktif**)
- **Tampilan:** pilihan **Table** / **Card**; bisa memilih baris lalu klik **Export Selected (n)**
- **Kolom:** No - Kode - Nama Kompetensi - Jabatan - Jenjang - Fungsi - Peran - Aksi (**Lihat Detail**)
- **Modal:** **Detail Standar Kompetensi**, **Export Standar Kompetensi** (Excel / PDF / Print), **Statistik** (per Jenjang / Jabatan / Fungsi)
- **Tombol header:** Refresh Data - Export Data - Cetak
- **Hanya baca** - tidak ada tambah/ubah/hapus.

## 6.4 Perencanaan

**Route:** `/perencanaan`

**Judul:** Perencanaan - "Dokumen perencanaan Pengembangan Kompetensi"

| Aspek | Detail |
| --- | --- |
| Format file | **PDF saja**, maksimal **20 MB** |
| Kolom tabel | No - Nama File - Ukuran - Diunggah Oleh - NIP - Tanggal Upload - Aksi |
| Aksi | **Lihat** (pratinjau di dalam aplikasi), **Download**, **Hapus** (hanya pengunggah atau Admin Tambun Raya) |
| Pencarian | "Cari nama file atau pengunggah..." |
| Pesan validasi | "File Belum Dipilih", "File Tidak Valid - Hanya file PDF yang diperbolehkan", "File Terlalu Besar - Ukuran file maksimal 20MB" |

## 6.5 Profil Kompetensi

**Route:** `/pegawai`

**Judul:** Manajemen Pegawai - "Kelola data pegawai dan analisis kompetensi"

- **Tag mode:** **Admin Tambun Raya** / **Ketua Tim (View Only)** / **User Biasa**
- **Tombol:** Refresh Data - Export Data - Cetak - Tambah Pegawai
  (Export Data masih placeholder: "Fitur export sedang dalam pengembangan")
- **Kartu:** Total Pegawai - Aktif - Tidak Aktif
- **Tab:** **Daftar Pegawai** (badge jumlah) dan **Statistik**
- **Filter:** Pencarian (NIP/Nama/Email) - Fungsi - Jabatan - Jenjang - Status (Aktif/Tidak Aktif) - **Reset**
- **Kolom tabel:** No - NIP - Nama - Jabatan - Jenjang - Fungsi - Peran - Status - Aksi
- **Aksi:** Detail - Edit - Analisis Kenaikan - Nonaktifkan
- **Tab Statistik:** kartu ringkasan + **Distribusi per Jabatan/Jenjang/Fungsi/Peran (Top 5)**
- **Modal:** Tambah Pegawai Baru, Edit Pegawai, Detail Pegawai, Analisis Kenaikan Jenjang, Konfirmasi Hapus

## 6.6 Pemenuhan per Peran

**Route:** `/pegawai/peran`

**Judul:** Pemenuhan Kompetensi per Peran

**Tahap 1 - Rekap:**

- Kartu: **Total Peran** - **Total Pegawai**
- Kolom: **Peran** (nama + fungsi) - **Jumlah Kompetensi** - **Total Pegawai** - **Aksi: Detail**
- Tombol: **Muat Ulang**

**Tahap 2 - Detail per Peran (judul: Pemenuhan Peran {nama peran}):**

- Tombol: **Kembali** - **Muat Ulang** - **Export** (CSV `Pemenuhan_Peran_{nama}.csv`)
- Kartu: **Total Pegawai** - **Sudah Memenuhi** - **Belum Memenuhi** - **Persentase**
- Filter: cari "Cari NIP / Nama / Email / Jabatan" - **Filter Fungsi** - **Reset**
- Kolom: NIP - Nama Pegawai - Fungsi - Jabatan - Jenjang - Peran - **Pemenuhan** (progress dipenuhi/total)
- Baris dapat **diperluas** untuk melihat rincian kompetensi wajib peran: Kode - Kompetensi - Fungsi - Tanggal Dipenuhi - Nilai - Status (**Dipenuhi** / **Belum**)

## 6.7 Pemenuhan per Kompetensi

**Route:** `/pegawai/kompetensi`

**Judul:** Pemenuhan per Kompetensi

**Tahap 1 - Rekap:**

- Kartu: **Total Kompetensi** - **Pemilik Sertifikat** - **Kompetensi Berisi** - **Total Tercatat**
- Filter: "Cari kode / nama / fungsi / peran"
- Kolom: **Kompetensi** (kode, nama, fungsi dan peran) - **Total Tercatat** - **Pemilik Sertifikat** - **Aksi: Detail**
- Tombol: **Muat Ulang**

**Tahap 2 - Detail (judul: Pemilik Sertifikat {kode}):**

- Tombol: **Kembali** - **Muat Ulang** - **Export** (CSV `Pemilik_Sertifikat_{kode}.csv`)
- Filter: "Cari NIP / Nama / Email / Jabatan" - **Reset**
- Kolom: NIP - Nama Pegawai - Fungsi - Jabatan - Jenjang - Tanggal Dipenuhi - Nilai - **Verifikasi** (nama verifikator + tanggal)
- Kriteria **pemilik sertifikat**: status **Lulus** dan hasil verifikasi **Valid**

## 6.8 Jadwal Pelatihan

**Route:** `/pelatihan`

**Judul:** Manajemen Pelatihan

- **Badge role:** "Admin (dapat mengelola master & kompetensi wajib)" / "Ketua Tim (dapat membuat jadwal pelatihan)"
- **Kartu:** Total Jadwal - Draft - Publik - Selesai
- **Tab:**
  1. **Jadwal Pelatihan** - semua role
  2. **Master Pelatihan** - hanya Admin Tambun Raya
  3. **Kompetensi Wajib** - hanya Admin Tambun Raya
- **Filter (tab Jadwal):** Pencarian "Cari nama pelatihan, lokasi..." - Status (Semua Status / Draft / Publik / Berlangsung / Selesai / Dibatalkan) - **Reset Filter**
- **Kolom tab Jadwal:** No - Kode - Nama Pelatihan - Tanggal - Lokasi, Metode, Peserta (n/kuota, n hadir, badge Undangan: {status}) - Status - Aksi
- **Pagination:** 10 / 25 / 50 / 100 per halaman

**Aksi baris jadwal:**

| Tombol | Kapan tersedia |
| --- | --- |
| **Detail** | Selalu |
| **Undang Peserta** | Status Draft atau Publik (Admin Tambun Raya/Katim) |
| **Edit** | Status **Draft** (Admin Tambun Raya/Katim) |
| **Publikasi** | Status **Draft** (Admin Tambun Raya/Katim) |
| **Mulai** | Status **Publik** (Admin Tambun Raya/Katim) |
| **Selesai** | Status **Berlangsung** (Admin Tambun Raya/Katim) |
| **Pantau** | Status **Selesai** (Admin Tambun Raya/Katim) |
| **Hapus** | Admin Tambun Raya (semua status) atau Katim (hanya Draft) |

**Detail Jadwal** memiliki 3 tab: **Informasi Pelatihan**, **Daftar Peserta (N)** (untuk Admin Tambun Raya/Katim) atau **Status Undangan Saya (N)** (untuk pegawai), dan **Kompetensi Terkait**.

**Tab Kompetensi Wajib:** dropdown **Tahun** + **Refresh**; kartu **Total Kompetensi Wajib**, **Tahun Aktif**, **Status**; kolom **No - Kode - Nama Kompetensi - Fungsi - Tahun - Aksi**; tombol **Tambah Kompetensi Wajib** dan **Hapus Semua {tahun}**.

## 6.9 Riwayat Pelatihan

**Route:** `/users_kompetensi`

**Judul:** Manajemen Kompetensi Pegawai

- **Badge role:** Admin Tambun Raya / Ketua Tim / User Biasa
- **Kartu:** Total - Lulus - Tidak Lulus - Dalam Proses
- **Tombol header:** Debug - **Tambah Kompetensi** - Refresh
- **Filter:** Pencarian - Status - **Hasil Verifikasi** (Belum Diverifikasi / Valid / Tidak Valid / Perlu Revisi) - Pegawai (hanya Admin Tambun Raya) - Kompetensi - **Reset Filter**
- **Cakupan data:**
  - Admin Tambun Raya: melihat semua data pegawai
  - Katim: melihat data pegawai di fungsi Anda
  - User: hanya melihat data Anda sendiri
- **Kolom:** No - Pegawai - Kompetensi - Tanggal Dipenuhi - Nilai - Status / Hasil - Sertifikat - Verifikator - Aksi
- **Aksi:** Detail - Lihat Sertifikat - Edit (diblokir bila sudah Valid) - Verifikasi (Admin Tambun Raya) - Hapus (Admin Tambun Raya/Katim)

---

# BAB 7 - DAFTAR STATUS DAN ARTINYA

| Konteks | Status | Arti |
| --- | --- | --- |
| **Jadwal Pelatihan** | **Draft** | Baru dibuat, belum terlihat oleh pegawai, undangan belum bisa dikonfirmasi |
| | **Publik** | Sudah dipublikasikan; pegawai dapat melihat & merespons undangan |
| | **Berlangsung** | Pelatihan sedang berjalan; kehadiran dapat diisi |
| | **Selesai** | Pelatihan tuntas; kompetensi terpenuhi & pantau sertifikat dapat dilakukan |
| | **Dibatalkan** | Jadwal dibatalkan |
| **Undangan Peserta** | **Pending** | Menunggu konfirmasi peserta |
| | **Diterima** | Peserta bersedia hadir |
| | **Ditolak** | Peserta tidak dapat hadir |
| **Kehadiran** | **Hadir / Tidak Hadir / Izin / Sakit** | Dicatat Admin Tambun Raya/Katim saat Berlangsung atau Selesai |
| **Status Kompetensi** | **Lulus** | Peserta lulus/dinyatakan menguasai |
| | **Tidak Lulus** | Peserta tidak lulus |
| | **Dalam Proses** | Masih dalam proses |
| **Hasil Verifikasi** | **(kosong)** | Belum Diverifikasi |
| | **Valid** | Diterima & sah |
| | **Tidak Valid** | Ditolak; pegawai boleh memperbaiki |
| | **Perlu Revisi** | Harus diperbaiki pegawai |
| **Dinyatakan MEMENUHI** | - | Hanya bila **status = Lulus** DAN **hasil_verif = Valid** |
| **Peserta Lengkap (Pantau)** | **Lengkap (n/m)** | Sudah mengunggah sertifikat untuk semua kompetensi terkait |
| | **Belum Lengkap (n/m)** | Masih ada kompetensi yang belum diunggah |
| | **Tanpa Kompetensi** | Pelatihan tidak dikaitkan dengan kompetensi apa pun |

---

# BAB 8 - ATURAN PENTING YANG PERLU DIKETAHUI

1. **Verifikasi sertifikat hanya oleh Admin Tambun Raya.** Katim dan pegawai tidak memiliki tombol Verifikasi.
2. **Satu sertifikat hanya dianggap sah bila berstatus Lulus + Valid.** Selain itu tidak dihitung pada dashboard maupun rekap pemenuhan.
3. **Data yang sudah Valid terkunci** - pegawai tidak bisa mengeditnya lagi. Jika ada kesalahan, admin dapat memverifikasi ulang dengan hasil **Tidak Valid** atau **Perlu Revisi** agar pegawai bisa memperbaiki.
4. **Perbaikan data otomatis menghapus hasil verifikasi lama** dan mengembalikannya ke status Belum Diverifikasi.
5. **Undangan hanya bisa direspons setelah jadwal dipublikasikan.** Selama jadwal masih Draft, undangan belum aktif.
6. **Jadwal berstatus Draft tidak terlihat oleh pegawai.**
7. **Jadwal hanya bisa diedit saat status Draft.**
8. **Katim hanya bisa menghapus jadwal berstatus Draft; admin bisa menghapus pada status apa pun** (data peserta & kehadiran ikut terhapus).
9. **NIP wajib 18 digit** pada form pegawai; pencocokan NIP di sistem dilakukan tanpa memperhatikan spasi.
10. **Upload sertifikat** (Riwayat Pelatihan): PDF/JPG/JPEG/PNG, maksimal **2 MB**.
11. **Upload dokumen Perencanaan**: hanya PDF, maksimal **20 MB**.
12. **Halaman Perencanaan** hanya dapat diakses **Admin Tambun Raya dan Katim**.
13. **Laporan CSV (Export)** yang benar-benar berfungsi ada pada halaman **Pemenuhan per Peran** dan **Pemenuhan per Kompetensi**. Tombol Export Data pada halaman **Profil Kompetensi** dan tab **Kompetensi (Reference)** masih belum aktif.
14. **Sesi login berlaku 4 jam**; setelah itu login ulang melalui SSO.
15. **Data Beranda diperbarui otomatis setiap 30 detik.**

---

# BAB 9 - PENANGANAN MASALAH UMUM

| Gejala | Kemungkinan penyebab | Solusi |
| --- | --- | --- |
| Tombol **Login dengan SSO** tidak berlanjut | Koneksi ke portal SSO terputus | Muat ulang halaman, coba lagi, hubungi admin bila tetap gagal |
| Menu **Perencanaan** tidak muncul | Role Anda bukan Admin Tambun Raya atau Katim | Hubungi administrator untuk penyesuaian role |
| Tombol **Tambah/Edit** pada Reference atau Profil Kompetensi tidak bisa diklik | Role Anda bukan admin_tambun_raya | Minta Admin Tambun Raya melakukan perubahan |
| Tombol **Verifikasi** tidak ada di Riwayat Pelatihan | Verifikasi hanya untuk Admin Tambun Raya | Hubungi Admin Tambun Raya |
| Peserta tidak bisa klik **Terima Undangan** | Jadwal masih berstatus **Draft** | Admin Tambun Raya/Katim harus klik **Publikasi** lebih dulu |
| Jadwal yang diundang tidak terlihat | Jadwal masih **Draft** | Tunggu publikasi jadwal |
| **Edit** pada Riwayat Pelatihan nonaktif | Data sudah diverifikasi **Valid** | Ajukan verifikasi ulang kepada admin |
| Sertifikat tidak bisa diunggah | Ukuran lebih dari 2 MB atau format bukan PDF/JPG/PNG | Kompres ukuran atau ubah format file |
| Dokumen Perencanaan gagal diunggah | Bukan PDF atau lebih dari 20 MB | Sesuaikan file |
| Data pegawai hanya menampilkan diri sendiri | Anda login sebagai pegawai biasa | Wajar - pegawai hanya melihat datanya sendiri |

---

# PENUTUP

Panduan ini mencakup seluruh modul aktif aplikasi: **Beranda, Reference (Master Data), Standar Kompetensi, Perencanaan, Profil Kompetensi, Pemenuhan per Peran, Pemenuhan per Kompetensi, Jadwal Pelatihan (Jadwal / Master / Kompetensi Wajib), dan Riwayat Pelatihan** - dengan alur kerja terpisah untuk **Admin Tambun Raya**, **Katim**, dan **Pegawai**.

**TAMBUN RAYA - Talenta Aparatur Mumpuni**

**Versi 1.0 - BBPOM di Palangka Raya**
