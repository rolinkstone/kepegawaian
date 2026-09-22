# PANDUAN PENGGUNAAN APLIKASI TAMBUN RAYA

### Aplikasi Kepegawaian GAP Kompetensi - Edisi Bergambar

**Balai Besar Pengawasan Obat dan Makanan (BBPOM) di Palangka Raya**

Disusun untuk tiga role: **Admin Tambun Raya**, **Ketua Tim (Katim)**, dan **Pegawai (User)**

Contoh tangkapan layar pada panduan ini diambil langsung dari aplikasi dengan login **Admin Tambun Raya**.

---

## Catatan Cara Membaca Panduan Ini

- Setiap bab memuat **gambar tampilan aplikasi** dan **penjelasan setiap isian/kolom**.
- Istilah yang ditulis **tebal** adalah nama tombol, menu, atau label yang persis ada di layar.
- Data pada gambar (nama pegawai, NIP, jumlah) adalah data nyata pada lingkungan tempat panduan ini dibuat; angka dan isinya dapat berbeda di lingkungan Anda.

---

# BAB 1 - LOGIN MELALUI SSO

## 1.1 Halaman Login

Halaman awal aplikasi hanya menampilkan satu tombol login. Tidak ada kolom username/password di aplikasi ini.

![Gambar 1. Halaman login aplikasi. Tombol Login dengan SSO berada di panel kanan, sedangkan identitas aplikasi dan tombol Tentang Sistem ada di panel kiri.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/02-login.png)

Keterangan elemen pada halaman login:

| Elemen | Penjelasan |
| --- | --- |
| **Login dengan SSO** | Satu-satunya cara masuk. Anda dialihkan ke halaman Keycloak untuk memasukkan akun. |
| Subteks "Akun terverifikasi BBPOM Palangka Raya" | Penanda bahwa autentikasi memakai akun instansi. |
| **SSL Encrypted** dan **SSO Authentication** | Badge keamanan koneksi dan metode login. |
| **Tentang Sistem** | Membuka penjelasan singkat aplikasi: tujuan, manfaat, fitur utama, visi dan misi. |
| **Download Panduan** | Mengunduh berkas panduan. |
| **TAMBUN RAYA v1.0** | Versi aplikasi yang sedang berjalan. |

## 1.2 Langkah Login

1. Buka alamat aplikasi. Halaman Login akan tampil.
2. Klik **Login dengan SSO**. Tombol berubah menjadi **Mengarahkan ke Portal SSO**.
3. Isi **Username** dan **Password** akun BBPOM Anda pada halaman Keycloak, lalu klik **Sign In**.
4. Anda otomatis kembali ke halaman **Beranda**.

Sesi login berlaku **4 jam**. Setelah habis, Anda diminta login kembali.

## 1.3 Logout

Klik **Logout** di bagian bawah sidebar. Aplikasi menghapus sesi aplikasi **dan** sesi SSO Keycloak, lalu mengembalikan Anda ke halaman Login.

---

# BAB 2 - BERANDA

## 2.1 Membuka Beranda

Menu **Home** lalu **Beranda** (route `/`). Halaman ini otomatis menyegarkan data **setiap 30 detik**.

![Gambar 2. Beranda versi Admin Tambun Raya: kartu sambutan, banner "Kompetensi yang harus diverifikasi", dan kartu statistik. Menu sidebar ditampilkan pada daftar BAB 2.2.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/01-beranda-penuh.png)

## 2.2 Penjelasan Setiap Bagian

| Bagian | Isi dan fungsinya |
| --- | --- |
| **Sidebar kiri** | Navigasi utama, terbagi grup: **Home**, **Peta Kompetensi** (Reference, Standar Kompetensi), **Perencanaan**, **Profil** (Profil Kompetensi, Pemenuhan per Peran, Pemenuhan per Kompetensi), **Pemenuhan Kompetensi** (Jadwal Pelatihan, Riwayat Pelatihan). Menu aktif ditandai warna biru. Ikon **☰** menutup/membuka sidebar. |
| **Header atas** | Judul halaman (**Dashboard** di Beranda), ikon lonceng notifikasi, nama pengguna, **badge role** (pada gambar: `admin_tambun_raya`), dan avatar inisial. |
| **Kartu sambutan** | **"Selamat Datang, {nama}!"**, badge role (**Admin Tambun Raya**), nama instansi, **NIP: ... | jabatan**, **Fungsi: ...**, dan **Login Terakhir** (tanggal dan jam login terakhir). |
| **Banner "Kompetensi yang harus diverifikasi"** | Khusus Admin Tambun Raya dan Katim. Menampilkan badge jumlah kompetensi yang belum diverifikasi, daftar pegawai beserta jumlah kompetensi yang menunggu, tiga contoh kompetensi (kode + nama + tag **Menunggu**), tautan **Lihat semua kompetensi user**, dan **Verifikasi sekarang**. |
| **Banner "Pegawai yang belum 100% memenuhi kompetensi wajib"** | Muncul bila ada pegawai yang belum tuntas kompetensi wajib tahun berjalan. Berisi persentase, jumlah dipenuhi/total, progress bar, dan tautan **Rekomendasi Pelatihan**. |
| **Banner "Anda memiliki X undangan pelatihan..."** | Muncul bila ada undangan pelatihan berstatus Pending, dengan tautan **Lihat undangan sekarang**. |
| **Kartu statistik (Admin/Katim)** | **TOTAL PEGAWAI** (seluruh pegawai aktif), **BELUM 100% KOMPETENSI WAJIB** (perlu pendampingan), **MENUNGGU VERIFIKASI** (perlu segera diverifikasi), **JADWAL PELATIHAN** (jumlah yang sedang berlangsung). |
| **Kartu statistik (Pegawai)** | **KOMPETENSI WAJIB**, **SUDAH DIPENUHI**, **BELUM DIPENUHI**, dan **UNDANGAN PELATIHAN**. |

## 2.3 Beranda versi Pegawai

Untuk pegawai (role `user`) tampilan berbeda: tidak ada banner verifikasi, tidak ada kartu Total Pegawai, dan muncul tambahan **Profil Kompetensi Anda** (progress pemenuhan, 5 kotak ringkasan: Kompetensi Wajib, Sudah Dipenuhi, Belum Dipenuhi, Dalam Proses, Total Kompetensi), daftar **Kompetensi Wajib yang Perlu Dipenuhi**, tombol **+ Tambah/Upload Kompetensi**, **Cari Pelatihan**, serta grafik **Status Kompetensi**, **Tren Pelatihan per Bulan**, **Master Pelatihan per Jenis**, **Kompetensi per Fungsi**, dan **Status Pelatihan**.

---

# BAB 3 - REFERENCE (MASTER DATA)

## 3.1 Membuka Modul

Menu **Peta Kompetensi** lalu **Reference** (route `/master`). Halaman berjudul **Master Data Kepegawaian** dengan subjudul *"Kelola data jabatan, jenjang, fungsi, peran, dan kompetensi"*.

Hak tulis modul ini **eksklusif Admin Tambun Raya**. Role lain hanya melihat (tombol tulis nonaktif dan tabel berlabel **Mode Baca**).

![Gambar 3. Tab Jabatan. Lima kartu statistik di atas, tombol Tambah Jabatan, dan tabel Daftar Jabatan.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/03-master-jabatan.png)

Keterangan tampilan:

| Bagian | Penjelasan |
| --- | --- |
| Badge `admin_tambun_raya` | Menandakan Anda login sebagai Admin Tambun Raya sehingga boleh menulis data. |
| Kartu statistik | **TOTAL JABATAN**, **TOTAL JENJANG**, **TOTAL FUNGSI**, **TOTAL PERAN**, **TOTAL KOMPETENSI** - jumlah data yang sudah terdaftar. |
| Tab | **Jabatan**, **Jenjang**, **Fungsi**, **Peran**, **Kompetensi**. Isi berurutan dari kiri ke kanan. |
| **Tambah Jabatan** | Membuka form penambahan data. |
| Tabel **Daftar Jabatan** | Kolom **ID**, **Nama Jabatan**, **Tanggal Dibuat**, **Aksi** (ikon **Edit** dan **Hapus**). |

## 3.2 Urutan Pengisian yang Dianjurkan

Isi master data dengan urutan ini karena saling bergantung:

1. **Jabatan** - klik **Tambah Jabatan**, isi **Nama Jabatan** (wajib), klik **Simpan**.
2. **Jenjang** - klik **Tambah Jenjang**, isi **Nama Jenjang** (wajib, contoh: *Ahli Pertama, Ahli Muda*), pilih **Tingkat**:
   - *Universal / Tanpa Tingkat* (0)
   - *Tingkat 1 - Ahli Pertama*
   - *Tingkat 2 - Ahli Muda*
   - *Tingkat 3 - Ahli Madya*
   - *Tingkat 4 - Ahli Utama*
   
   Klik **Simpan**. Tingkat menentukan urutan jenjang dan *reuse* kompetensi.
3. **Fungsi** - klik **Tambah Fungsi**, isi **Nama Fungsi** (wajib), klik **Simpan**.
4. **Peran** - klik **Tambah Peran**, isi:
   - **Fungsi** (wajib) - fungsi pemilik peran.
   - **Nama Peran** (wajib) - contoh: *Penguji, Pemeriksa, Auditor Internal*.
   - Switch **Lintas Fungsi** - bila diaktifkan, peran muncul di semua fungsi (contoh: BMN).
   
   Klik **Simpan**. Tersedia **Filter Fungsi** untuk menyaring daftar peran.
5. **Kompetensi** - lihat 3.3.

## 3.3 Tab Kompetensi dan Pemetaannya

![Gambar 4. Tab Kompetensi: filter Fungsi/Peran/pencarian, tabel Kode - Nama Kompetensi - Fungsi - Peran - Mapping, serta tombol Atur Mapping per baris.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/04-master-kompetensi.png)

Penjelasan kolom dan tombol:

| Kolom/Tombol | Penjelasan |
| --- | --- |
| **Kode** | Kode unik kompetensi (monospace), contoh `ADI-01`. |
| **Nama Kompetensi** | Nama kompetensi; deskripsi ditampilkan satu baris di bawahnya. |
| **Fungsi** | Fungsi pemilik kompetensi. |
| **Peran** | Peran default kompetensi. |
| **Mapping** | Dua chip pertama berisi *Jabatan - Jenjang* yang dipetakan; chip **+n** menampilkan sisanya; tombol **Atur Mapping** untuk mengubah pemetaan. Bila belum ada: *"Belum ada mapping"*. |
| **Aksi** | **Lihat** (lihat detail mapping), **Edit** (ubah kompetensi), **Hapus** (menghapus kompetensi sekaligus seluruh mapping-nya). |
| Filter | **Filter Fungsi**, **Filter Peran**, kolom **Cari Kompetensi** (kode/nama/deskripsi), dan **Reset Filter**. |

### Form Tambah Kompetensi

![Gambar 5. Form Tambah Kompetensi Baru: Kode Kompetensi, Fungsi, Peran Default, Nama Kompetensi, Deskripsi, dan blok Mapping Jabatan, Jenjang & Peran.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/05-master-form-kompetensi.png)

Penjelasan setiap isian:

| Isian | Wajib | Keterangan |
| --- | --- | --- |
| **Kode Kompetensi** | Ya | Contoh format: `K001`, `P001`, `A001`. |
| **Fungsi** | Ya | Fungsi pemilik kompetensi. |
| **Peran Default** | Ya | Pilihan berisi peran dari fungsi terpilih **plus** peran *Lintas Fungsi*. **Tidak dapat diubah saat mode Edit.** |
| **Nama Kompetensi** | Ya | Nama lengkap kompetensi. |
| **Deskripsi (Opsional)** | Tidak | Uraian singkat kompetensi. |
| **Mapping Jabatan, Jenjang & Peran** | - | Blok pemetaan kompetensi ke kombinasi jabatan + jenjang + peran. |
| **MAPPING KE SEMUA** | - | Memetakan ke seluruh jabatan dan jenjang (syarat: Fungsi dan Peran Default sudah terisi). |
| **KOSONGKAN** | - | Menghapus seluruh baris mapping. |
| **+ TAMBAH MAPPING** | - | Menambah satu baris mapping baru. Pada baris tersebut pilih **Jabatan**, **Jenjang**, **Peran**, dan centang **Wajib** bila kompetensi wajib untuk kombinasi itu. |
| **BATAL** / **SIMPAN** | - | **BATAL** membatalkan; **SIMPAN** menyimpan kompetensi beserta mapping-nya. |

Catatan pada form: *"Satu kompetensi dapat dipetakan ke beberapa kombinasi jabatan, jenjang & peran (reuse kompetensi)"*, *"Warna border kiri menunjukkan peran yang dipilih untuk mapping"*, dan *"Peran default kompetensi akan otomatis terisi pada mapping baru"*.

### Modal Atur Mapping

![Gambar 6. Modal Atur Mapping Kompetensi: form tambah mapping, blok Mapping ke Semua, dan tabel daftar mapping dengan kolom Status (Wajib/Opsional).](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/06-master-mapping.png)

| Bagian | Penjelasan |
| --- | --- |
| Baris tambah | **Jabatan**, **Jenjang**, centang **Wajib**, lalu tombol **Tambah**. |
| **Atau mapping otomatis ke semua jabatan & jenjang** | Tombol **Mapping ke Semua**; peran mengikuti peran default kompetensi. Muncul dialog konfirmasi sebelum dijalankan. |
| Tabel **Daftar Mapping (n)** | Kolom **No**, **Jabatan**, **Jenjang**, **Tingkat**, **Status** (chip *Wajib* / *Opsional*; dapat diubah pada mode edit), **Aksi** (hapus baris). |
| **Selesai** / **Tutup** | **Selesai** menyimpan perubahan; **Tutup** menutup modal (mode lihat). |

---

# BAB 4 - STANDAR KOMPETENSI

Menu **Peta Kompetensi** lalu **Standar Kompetensi** (route `/standar_kompetensi`). Modul ini **hanya baca** - tidak ada penambahan, perubahan, atau penghapusan. Satu baris mewakili satu kombinasi kompetensi + jabatan + jenjang.

![Gambar 7. Standar Kompetensi: kartu statistik Total Mapping/Jabatan/Jenjang/Fungsi, kolom pencarian, filter Jabatan/Jenjang/Tingkat, serta tombol Refresh Data, Export Data, dan Cetak.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/07-standar-kompetensi.png)

| Elemen | Penjelasan |
| --- | --- |
| **TOTAL MAPPING** | Jumlah seluruh baris pemetaan kompetensi (*"Seluruh data kompetensi"*). |
| **JABATAN / JENJANG / FUNGSI** | Jumlah jabatan, jenjang, dan fungsi yang terdaftar. |
| **Cari kode/nama/deskripsi kompetensi...** | Pencarian teks bebas. |
| **Filter Jabatan / Filter Jenjang / Filter Tingkat** | Penyaringan data. Pilihan tingkat: *Semua Tingkat, Ahli Pertama (Level 1), Ahli Muda (Level 2), Ahli Madya (Level 3), Universal (Level 0)*. |
| **Lanjutan** | Membuka filter tambahan: **Filter Fungsi**, **Filter Peran**, **Total Data**, dan badge **Filter Aktif**. |
| **Table / Card** | Mengubah gaya penyajian data. |
| Kolom tabel | **No**, **Kode**, **Nama Kompetensi**, **Jabatan**, **Jenjang**, **Fungsi**, **Peran**, **Aksi** (tombol mata untuk **Lihat Detail**). Klik ganda pada baris juga membuka detail. |
| **Export Selected (n)** | Mengekspor baris yang dipilih. |
| **Export Data** | Pilihan **Export ke Excel** dan **Export ke PDF**. |
| **Cetak** | Mencetak halaman. |
| **Refresh Data** | Memuat ulang data dari server. |

Tab **Statistik** menampilkan rekap jumlah standar kompetensi **per Jenjang**, **per Jabatan**, dan **per Fungsi**.

---

# BAB 5 - PERENCANAAN

Menu **Perencanaan** (route `/perencanaan`). Modul ini menyimpan **dokumen perencanaan pengembangan kompetensi dalam bentuk PDF**.

Akses: **Admin Tambun Raya** dan **Katim**.

![Gambar 8. Halaman Perencanaan: subjudul dokumen, tombol Upload Dokumen, kotak pencarian, dan tabel daftar dokumen (No, Nama File, Ukuran, Diunggah Oleh, NIP, Tanggal Upload, Aksi).](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/08-perencanaan.png)

| Elemen | Penjelasan |
| --- | --- |
| Subjudul | *"Dokumen perencanaan Pengembangan Kompetensi."* |
| **Upload Dokumen** | Membuka form unggah dokumen (hanya tampil bagi role yang berhak). |
| **Cari nama file atau pengunggah...** | Menyaring tabel berdasarkan nama file, nama pengunggah, atau NIP. |
| Tabel | **No**, **Nama File** (dapat diklik untuk pratinjau), **Ukuran** (B/KB/MB), **Diunggah Oleh**, **NIP**, **Tanggal Upload**, **Aksi**. |
| **Aksi** | **Lihat** (pratinjau PDF di dalam aplikasi), **Download**, **Hapus** (hanya pengunggah atau Admin Tambun Raya). |
| Kondisi kosong | *"Belum ada dokumen perencanaan"*. |

## 5.1 Form Upload Dokumen

![Gambar 9. Modal Upload Dokumen Perencanaan: isian Judul/Nama Dokumen dan pemilih File PDF.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/09-perencanaan-upload.png)

| Isian | Wajib | Keterangan |
| --- | --- | --- |
| **Judul / Nama Dokumen** | Tidak | Opsional; bila dikosongkan, nama dokumen memakai nama file. Contoh isian: *Rencana Kerja Tahunan 2026*. |
| **File PDF** | Ya | Hanya berkas **PDF**, ukuran **maksimal 20 MB**. Keterangan pada form: *"Hanya file PDF, maksimal 20MB"*. |
| **Batal** / **Upload** | - | **Batal** menutup form; **Upload** mengunggah dokumen dan menyimpannya ke daftar. |

Pesan yang dapat muncul: *"File Belum Dipilih - Silakan pilih file PDF terlebih dahulu"*, *"File Tidak Valid - Hanya file PDF yang diperbolehkan"*, dan *"File Terlalu Besar - Ukuran file maksimal 20MB"*.

---

# BAB 6 - PROFIL KOMPETENSI (DATA PEGAWAI)

Menu **Profil** lalu **Profil Kompetensi** (route `/pegawai`). Halaman berjudul **Manajemen Pegawai**.

Peran tiap role: Admin Tambun Raya dapat menambah/mengubah/menonaktifkan; Katim hanya melihat; pegawai hanya melihat datanya sendiri.

![Gambar 10. Manajemen Pegawai: tombol Refresh Data, Export Data, Cetak, Tambah Pegawai; kartu Total Pegawai/Aktif/Tidak Aktif; filter dan tabel pegawai.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/10-pegawai.png)

| Elemen | Penjelasan |
| --- | --- |
| Tag role | **Admin Tambun Raya**, **Ketua Tim (View Only)**, atau **User Biasa** sesuai akun yang login. |
| **Refresh Data** | Memuat ulang daftar pegawai. |
| **Export Data** | Menu ekspor pada halaman ini masih dalam pengembangan. |
| **Cetak** | Mencetak halaman. |
| **Tambah Pegawai** | Aktif hanya untuk Admin Tambun Raya. |
| Kartu | **TOTAL PEGAWAI**, **AKTIF**, **TIDAK AKTIF**. |
| Filter | **Pencarian** (NIP/Nama/Email), **Fungsi**, **Jabatan**, **Jenjang**, **Status** (Aktif/Tidak Aktif), dan **Reset**. |
| Tab | **Daftar Pegawai** dan **Statistik**. |
| Tabel | **No**, **NIP**, **Nama** (beserta email), **Jabatan**, **Jenjang**, **Fungsi**, **Peran**, **Status**, **Aksi**. |
| **Aksi** | **Detail** (mata), **Edit** (pensil), **Analisis Kenaikan** (grafik), **Nonaktifkan** (tempat sampah). |
| Tab **Statistik** | Rekap per jabatan/jenjang/fungsi/peran versi Top 5. |

## 6.1 Form Tambah/Edit Pegawai

![Gambar 11. Modal Tambah Pegawai Baru. Isian wajib ditandai bintang, dan status pegawai baru diatur otomatis Aktif.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/11-pegawai-form.png)

| Isian | Wajib | Keterangan |
| --- | --- | --- |
| **NIP** | Ya | **Harus 18 digit angka**. Placeholder: *"Masukkan NIP (18 digit)"*. |
| **Nama Lengkap** | Ya | Nama pegawai beserta gelar. |
| **Fungsi** | Ya | Pilih dari daftar master Fungsi. |
| **Jabatan** | Ya | Pilih dari daftar master Jabatan. |
| **Jenjang** | Ya | Pilih dari daftar master Jenjang. |
| **Peran** | Ya | Boleh lebih dari satu (minimal 1). Daftar peran dikelompokkan per fungsi. |
| **Email** | Tidak | Harus berformat email yang benar. |
| **No. HP** | Tidak | Nomor kontak pegawai. |
| **Tanggal Bergabung** | Tidak | Format tanggal. |
| **Status** | - | Switch **Aktif** / **Tidak Aktif**; hanya muncul pada mode **Edit**. |
| **Simpan Perubahan** | - | Tombol simpan pada mode Edit (pada mode tambah: **Simpan**). |

## 6.2 Analisis Kenaikan Jenjang

Klik ikon **Analisis Kenaikan** pada baris pegawai. Modal bersifat **hanya baca** (tidak menyimpan apa pun) dan menampilkan:

1. **Informasi Pegawai**: Nama, NIP, Jabatan, Jenjang Saat Ini, Fungsi, Peran.
2. Filter **Pilih Fungsi** dan **Pilih Target Jenjang** (opsi jenjang diberi keterangan tingkat, *Saat Ini*, atau *Kenaikan*).
3. **Informasi Peran**: Peran Dimiliki, Peran Tidak Dimiliki (ditandai `*`), Total Peran.
4. Statistik **Target Jenjang**, **Total Kompetensi**, **MEMENUHI**, **TIDAK MEMENUHI**, dan progress bar persentase.
5. Tabel kompetensi dengan kolom **Pemenuhan Kompetensi** (V = memenuhi, X = tidak memenuhi).

Pegawai yang dinyatakan **memenuhi** adalah pemilik catatan kompetensi dengan status **Lulus** dan hasil verifikasi **Valid**.

---

# BAB 7 - PEMENUHAN PER PERAN

Menu **Profil** lalu **Pemenuhan per Peran** (route `/pegawai/peran`). Semua role dapat membuka halaman ini.

![Gambar 12. Rekap Pemenuhan Kompetensi per Peran: kartu Total Peran dan Total Pegawai, kolom Peran, Jumlah Kompetensi, Total Pegawai, dan tombol Detail.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/12-peran-rekap.png)

Tahap rekap:

| Elemen | Penjelasan |
| --- | --- |
| **TOTAL PERAN** | Jumlah peran yang terdaftar. |
| **TOTAL PEGAWAI** | Jumlah pegawai yang memiliki peran. |
| Kolom **Peran** | Nama peran beserta fungsinya; ditandai **Lintas Fungsi** bila berlaku untuk semua fungsi. |
| Kolom **Jumlah Kompetensi** | Jumlah kompetensi wajib pada peran tersebut. |
| Kolom **Total Pegawai** | Jumlah pegawai pemilik peran. |
| **Detail** | Membuka rincian pemenuhan peran tersebut. |
| **Muat Ulang** | Memuat ulang data. |

Setelah menekan **Detail**, tampil halaman rincian:

![Gambar 13. Detail Pemenuhan Peran: statistik Total Pegawai, Sudah Memenuhi, Belum Memenuhi, dan Persentase, dengan tabel pegawai yang bisa diperluas untuk melihat kompetensi wajib peran.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/13-peran-detail.png)

| Elemen | Penjelasan |
| --- | --- |
| Judul | **Pemenuhan Peran {nama peran}**, subjudul *"Menampilkan pegawai beserta status pemenuhan terhadap seluruh kompetensi wajib peran tersebut."* |
| **Kembali** | Kembali ke daftar rekap peran. |
| **Muat Ulang** | Memuat ulang data peran ini. |
| **Export** | Mengunduh daftar pemenuhan peran dalam format **CSV**. |
| Kartu | **Total Pegawai**, **Sudah Memenuhi**, **Belum Memenuhi**, **Persentase**. |
| Filter | Pencarian *"Cari NIP / Nama / Email / Jabatan"*, **Filter Fungsi**, dan **Reset**. |
| Kolom tabel | **NIP**, **Nama Pegawai**, **Fungsi**, **Jabatan**, **Jenjang**, **Peran**, dan **Pemenuhan** (progress melingkar `dipenuhi/total`). |
| Baris diperluas | Menampilkan daftar kompetensi wajib peran: **Kode**, **Kompetensi**, **Fungsi**, **Tanggal Dipenuhi**, **Nilai**, dan **Status** (*Dipenuhi* / *Belum*). |

---

# BAB 8 - PEMENUHAN PER KOMPETENSI

Menu **Profil** lalu **Pemenuhan per Kompetensi** (route `/pegawai/kompetensi`). Halaman ini menjawab pertanyaan: *siapa saja yang sudah memiliki sertifikat kompetensi tertentu?*

![Gambar 14. Rekap Pemenuhan per Kompetensi: kartu statistik, pencarian kode/nama/fungsi/peran, kolom Total Tercatat dan Pemilik Sertifikat, serta tombol Detail.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/14-kompetensi-rekap.png)

| Elemen | Penjelasan |
| --- | --- |
| **TOTAL KOMPETENSI** | Jumlah kompetensi terdaftar. |
| **PEMILIK SERTIFIKAT** | Jumlah pegawai yang memiliki sertifikat (status **Lulus** dan hasil verifikasi **Valid**). |
| **KOMPETENSI BERISI** | Jumlah kompetensi yang sudah memiliki pemilik sertifikat. |
| **TOTAL TERCATAT** | Seluruh catatan kompetensi pegawai. |
| Pencarian | *"Cari kode / nama / fungsi / peran"*. |
| Kolom **Kompetensi** | Ikon sertifikat, kode kompetensi, nama, dan keterangan fungsi dan peran. |
| Kolom **Total Tercatat** | Jumlah pegawai yang memiliki catatan kompetensi tersebut. |
| Kolom **Pemilik Sertifikat** | Jumlah pegawai dengan status Lulus dan hasil Valid. |
| **Detail** | Membuka daftar pemilik sertifikat. |

![Gambar 15. Detail Pemilik Sertifikat: kartu jumlah pemilik sertifikat, pencarian, dan tabel pemilik beserta tanggal dipenuhi, nilai, dan verifikatornya.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/15-kompetensi-detail.png)

| Elemen | Penjelasan |
| --- | --- |
| Judul | **Pemilik Sertifikat {kode}**, subjudul *"Menampilkan pegawai yang memiliki sertifikat kompetensi tersebut (status Lulus & Valid)."* |
| **Kembali** / **Muat Ulang** | Kembali ke rekap atau memuat ulang data. |
| **Export** | Mengunduh daftar pemilik sertifikat dalam format **CSV** (memuat NIP, Nama, Fungsi, Jabatan, Jenjang, Peran, Tanggal Dipenuhi, Nilai, Diverifikasi Oleh, Tanggal Verifikasi). |
| Kolom tabel | **NIP**, **Nama Pegawai**, **Fungsi**, **Jabatan**, **Jenjang**, **Tanggal Dipenuhi**, **Nilai**, dan **Verifikasi** (nama verifikator beserta tanggalnya). |
| Filter | Pencarian *"Cari NIP / Nama / Email / Jabatan"* dan **Reset**. |

---

# BAB 9 - JADWAL PELATIHAN

Menu **Pemenuhan Kompetensi** lalu **Jadwal Pelatihan** (route `/pelatihan`). Halaman berjudul **Manajemen Pelatihan**.

Badge pada header menunjukkan kewenangan Anda: *"Admin (dapat mengelola master & kompetensi wajib)"* untuk Admin Tambun Raya, atau *"Ketua Tim (dapat membuat jadwal pelatihan)"* untuk Katim.

## 9.1 Tab Jadwal Pelatihan

![Gambar 16. Tab Jadwal Pelatihan: kartu Total Jadwal/Draft/Publik/Selesai, tombol Buat Jadwal Pelatihan dan Refresh, serta tab Master Pelatihan dan Kompetensi Wajib yang hanya muncul untuk Admin.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/16-pelatihan-jadwal.png)

| Elemen | Penjelasan |
| --- | --- |
| **Total Jadwal / Draft / Publik / Selesai** | Ringkasan jumlah jadwal pada masing-masing status. |
| **Buat Jadwal Pelatihan** | Tampil untuk Admin Tambun Raya dan Katim. |
| **Refresh** | Memuat ulang daftar jadwal. |
| Tab | **Jadwal Pelatihan** (semua role), **Master Pelatihan** dan **Kompetensi Wajib** (hanya Admin Tambun Raya). |
| Filter | Pencarian *"Cari nama pelatihan, lokasi..."*, **Status** (Semua Status / Draft / Publik / Berlangsung / Selesai / Dibatalkan), dan **Reset Filter**. |
| Kolom tabel | **No**, **Kode**, **Nama Pelatihan**, **Tanggal**, **Lokasi, Metode, Peserta** (jumlah/kuota, jumlah hadir, badge **Undangan: {status}** untuk undangan Anda), **Status**, **Aksi**. |
| **Aksi** | **Detail**, **Undang Peserta** (status Draft/Publik), **Edit** (status Draft), **Publikasi** (status Draft), **Mulai** (status Publik), **Selesai** (status Berlangsung), **Pantau** (status Selesai), **Hapus** (Admin untuk semua status, Katim hanya Draft). |

Bagi pegawai, tab ini hanya menampilkan jadwal yang mengundang dirinya, dengan keterangan *"Info: Menampilkan N jadwal pelatihan yang mengundang Anda."*

## 9.2 Form Buat Jadwal Pelatihan

![Gambar 17. Form Buat Jadwal Pelatihan Baru yang berisi Informasi Pelatihan, Jadwal dan Lokasi, Deskripsi/Catatan, serta pemilih Undang Peserta.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/17-pelatihan-form-jadwal.png)

| Isian | Wajib | Keterangan |
| --- | --- | --- |
| **Nama Pelatihan** | Ya | Dipilih dari Master Pelatihan, tampil sebagai `kode - nama (jenis)`. |
| Keterangan master | - | Setelah dipilih, muncul informasi deskripsi, durasi, dan jenis pelatihan. |
| **Nama Penyelenggara** | Tidak | Teks bebas, contoh: BBPOM, Lembaga Diklat, dll. |
| **Penyelenggara (Pegawai)** | Ya | Muncul hanya bila akun admin Anda tidak terdaftar sebagai data pegawai; pilih pegawai penyelenggara. |
| **Tanggal Mulai** | Ya | Tidak boleh melewati Tanggal Selesai. |
| **Tanggal Selesai** | Ya | Tidak boleh lebih awal dari Tanggal Mulai. |
| **Waktu Mulai / Waktu Selesai** | Tidak | Jam pelaksanaan. |
| **Lokasi** | Tidak | Contoh: Ruang Meeting, Zoom Meeting, dll. |
| **Metode** | Tidak | **Offline**, **Online**, atau **Hybrid** (default: Offline). |
| **Kuota Peserta** | Tidak | Kosongkan bila tidak terbatas. |
| **Deskripsi / Catatan** | Tidak | Catatan tambahan pelatihan. |
| **Undang Peserta (Opsional)** | Tidak | Memilih beberapa pegawai sekaligus saat jadwal dibuat. Setiap peserta tercatat dengan status undangan **Pending**. |
| **Batal** / **Simpan** | - | **Simpan** menyimpan jadwal baru dengan status awal **Draft**. |

## 9.3 Tab Master Pelatihan

![Gambar 18. Tab Master Pelatihan: tombol Buat Master Pelatihan dan tabel Kode, Nama Pelatihan, Jenis, Durasi, Status Aktif/Tidak Aktif, dan Aksi.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/18-pelatihan-master.png)

Isian form **Tambah Master Pelatihan**:

| Isian | Wajib | Keterangan |
| --- | --- | --- |
| **Kode Pelatihan** | Ya | Contoh: `TEK-001`. |
| **Nama Pelatihan** | Ya | Contoh: *Pengujian Menggunakan HPLC*. |
| **Deskripsi** | Tidak | Uraian pelatihan. |
| **Jenis Pelatihan** | Tidak | **Teknis** (default), **Manajerial**, **Sertifikasi**, atau **Umum**. |
| **Durasi (jam)** | Tidak | Angka, minimal 1. |
| **Biaya (Rp)** | Tidak | Angka, minimal 0. |
| **Kompetensi yang Terkait** | Tidak | Boleh lebih dari satu; menentukan kompetensi mana yang dicatat terpenuhi saat pelatihan selesai. |

Kolom tabel master: **Kode**, **Nama Pelatihan** (beserta deskripsi), **Jenis**, **Durasi**, **Status** (*Aktif* / *Tidak Aktif*), dan **Aksi** (**Edit**, **Hapus**).

## 9.4 Tab Kompetensi Wajib

![Gambar 19. Tab Kompetensi Wajib: pemilih Tahun, tombol Refresh, kartu Total Kompetensi Wajib / Tahun Aktif / Status, dan tombol Tambah Kompetensi Wajib.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/19-pelatihan-wajib.png)

| Elemen | Penjelasan |
| --- | --- |
| Subjudul | *"Daftar kompetensi yang wajib dipenuhi oleh pegawai setiap tahunnya"*. |
| **Tahun** | Menentukan tahun penetapan kompetensi wajib (contoh: 2026). |
| **Refresh** | Memuat ulang data untuk tahun terpilih. |
| **Total Kompetensi Wajib** | Jumlah kompetensi wajib pada tahun tersebut. |
| **Tahun Aktif** | Tahun yang sedang dipilih. |
| **Status** | **Aktif**, **Lampau**, atau **Mendatang**. |
| **Tambah Kompetensi Wajib** | Membuka form penetapan; isi **Tahun**, lalu centang kompetensi (tersedia **Select All / Deselect All** dan keterangan **Terpilih: N kompetensi**), lalu **Simpan**. |
| **Hapus Semua {tahun}** | Menghapus seluruh penetapan kompetensi wajib pada tahun itu. |
| Kolom tabel | **No**, **Kode**, **Nama Kompetensi**, **Fungsi**, **Tahun**, **Aksi**. |
| Bila kosong | *"Belum ada kompetensi wajib untuk tahun {tahun}"* beserta tombol **+ Tambah Kompetensi Wajib**. |

Kompetensi wajib inilah yang muncul sebagai daftar tugas di **Beranda** pegawai dan menjadi dasar persentase pemenuhan 100%.

## 9.5 Alur Pelatihan sampai Verifikasi

1. **Buat jadwal** - status awal **Draft**.
2. **Undang Peserta** - dari baris jadwal (status Draft/Publik) atau dari **Detail** jadwal; peserta masuk dengan status **Pending**.
3. **Publikasi** (ikon share) - status berubah menjadi **Publik**; undangan dapat dikonfirmasi peserta.
4. **Peserta merespons** - di **Detail** jadwal, tab **Status Undangan Saya**, klik **Terima Undangan** atau **Tolak Undangan**.
5. **Mulai** - status menjadi **Berlangsung**.
6. **Catat kehadiran** - di **Detail**, tab **Daftar Peserta (N)**, ubah **Kehadiran**: *Hadir, Tidak Hadir, Izin, Sakit*.
7. **Selesai** - status menjadi **Selesai**.
8. **Kompetensi Terpenuhi** - tombol pada baris peserta (status Selesai) untuk mencatat kompetensi yang dikuasai peserta.
9. **Pantau** - pada jadwal Selesai, tombol **Pantau** menampilkan **Pantau Sertifikat Peserta**: kartu **Total Peserta (Diterima)**, **Upload Kompetensi**, **Peserta Lengkap**, **Peserta Belum Lengkap**, serta status per peserta **Lengkap (n/m)** / **Belum Lengkap (n/m)** / **Tanpa Kompetensi**.
10. **Unggah sertifikat oleh peserta** melalui modul **Riwayat Pelatihan** (lihat BAB 10).
11. **Verifikasi oleh Admin Tambun Raya** melalui modul **Riwayat Pelatihan**.

Urutan status jadwal:

```
Draft -> Publik -> Berlangsung -> Selesai
               -> Dibatalkan (dari Publik atau Berlangsung)
```

---

# BAB 10 - RIWAYAT PELATIHAN

Menu **Pemenuhan Kompetensi** lalu **Riwayat Pelatihan** (route `/users_kompetensi`). Halaman berjudul **Manajemen Kompetensi Pegawai**. Modul ini adalah tempat **pegawai mengunggah sertifikat** dan **Admin Tambun Raya memverifikasinya**.

![Gambar 20. Riwayat Pelatihan: kartu Total/Lulus/Tidak Lulus/Dalam Proses, tombol Tambah Kompetensi, dan filter Pencarian, Status, dan Reset Filter.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/20-riwayat.png)

| Elemen | Penjelasan |
| --- | --- |
| Kartu | **Total**, **Lulus**, **Tidak Lulus**, **Dalam Proses**. |
| **Debug** | Menampilkan informasi teknis ke konsol browser (untuk pengecekan). |
| **Tambah Kompetensi** | Membuka form penambahan kompetensi pegawai. |
| **Refresh** | Memuat ulang daftar. |
| Filter | **Pencarian** (nama, NIP, kompetensi), **Status** (Semua Status / Lulus / Tidak Lulus / Dalam Proses), **Hasil Verifikasi** (Belum Diverifikasi / Valid / Tidak Valid / Perlu Revisi), **Pegawai** (khusus Admin Tambun Raya), **Kompetensi**, dan **Reset Filter**. |
| Cakupan data | Admin Tambun Raya melihat semua data pegawai; Katim melihat data pegawai di fungsi Anda; Pegawai hanya melihat data Anda sendiri. |
| Kolom tabel | **No**, **Pegawai** (nama, NIP, fungsi), **Kompetensi** (nama, kode), **Tanggal Dipenuhi**, **Nilai**, **Status / Hasil** (badge status dan hasil verifikasi), **Sertifikat** (tautan **Lihat**), **Verifikator** (nama dan tanggal, atau *"Belum diverifikasi"*), **Aksi**. |
| **Aksi** | **Detail**, **Lihat Sertifikat**, **Edit** (nonaktif bila sudah **Valid**), **Verifikasi** (hanya Admin Tambun Raya), **Hapus** (Admin Tambun Raya dan Katim). |

## 10.1 Form Tambah/Edit Kompetensi

![Gambar 21. Modal Tambah Kompetensi Pegawai. Untuk Admin, tersedia isian Pilih Pegawai; pegawai biasa langsung tercatat atas namanya sendiri.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/21-riwayat-form.png)

| Isian | Wajib | Keterangan |
| --- | --- | --- |
| Banner mode | - | *"Mode Admin: Anda dapat memilih pegawai yang akan ditambahkan kompetensinya"* atau *"Mode User: Kompetensi akan ditambahkan untuk Anda sendiri"*. |
| **Pilih Pegawai** | Ya | **Hanya muncul untuk Admin**; cari berdasarkan nama atau NIP. Untuk pegawai biasa, terisi otomatis nama sendiri. |
| **Kompetensi** | Ya | Cari berdasarkan nama, kode, atau fungsi. Tersedia tips: *"Ketik untuk mencari kompetensi berdasarkan nama, kode, atau fungsi"*. |
| **Tanggal Dipenuhi** | Ya | Tanggal kompetensi diperoleh. |
| **Nilai (0-100)** | Tidak | Nilai/score; boleh desimal. |
| **Status** | Tidak | **Lulus**, **Tidak Lulus**, atau **Dalam Proses** (default: *Dalam Proses*). |
| **Upload Sertifikat/Bukti** | Tidak | Berkas PDF, JPG, atau PNG dengan ukuran **maksimal 2 MB** (*"Format: PDF, JPG, PNG. Maksimal 2MB"*). |
| **Batal** / **Simpan** | - | Setelah disimpan, data berstatus **Belum Diverifikasi** dan menunggu verifikasi Admin Tambun Raya. |

Bila hasil verifikasi bernilai **Tidak Valid** atau **Perlu Revisi**, pemilik data dapat menekan **Edit**, memperbaiki isian/unggahan, lalu **Simpan**. Hasil verifikasi lama otomatis dihapus dan status kembali **Belum Diverifikasi**.

## 10.2 Form Verifikasi (Khusus Admin Tambun Raya)

![Gambar 22. Modal Verifikasi Kompetensi: informasi pegawai dan kompetensi, Verifikator (Admin yang Login), isian Status Verifikasi dan Hasil Verifikasi, Keterangan, serta ringkasan verifikasi.](file:///C:/Users/rolly/AppData/Local/Temp/tambun-panduan/img-pdf/22-riwayat-verifikasi.png)

| Isian | Wajib | Keterangan |
| --- | --- | --- |
| Blok **Informasi Pegawai** | - | Nama, NIP, dan fungsi pemilik data (hanya baca). |
| Blok **Informasi Kompetensi** | - | Kompetensi, kode, tanggal dipenuhi, nilai, status saat ini, hasil sebelumnya (hanya baca). |
| Blok **Verifikator (Admin yang Login)** | - | Nama admin yang akan tercatat sebagai verifikator beserta NIP. Pesan: *"Nama di atas akan tercatat sebagai verifikator"*. |
| **Status Verifikasi** | Ya | **Lulus**, **Tidak Lulus**, atau **Dalam Proses**. |
| **Hasil Verifikasi** | Ya | **Valid**, **Tidak Valid**, atau **Perlu Revisi**. |
| **Keterangan** | Tidak | Catatan verifikasi, misalnya alasan penolakan atau hal yang perlu direvisi. |
| Blok **Verifikasi Sebelumnya** | - | Menampilkan riwayat verifikasi (diverifikasi oleh, pada, keterangan) bila data pernah diverifikasi. |
| **Ringkasan Verifikasi** | - | Verifikator, status baru, hasil verifikasi, keterangan, dan waktu verifikasi. |
| **Batal** / **Verifikasi** | - | Tombol **Verifikasi** nonaktif sampai Status dan Hasil Verifikasi dipilih. |

**Syarat kompetensi dianggap sudah memenuhi:** status **Lulus** dan hasil verifikasi **Valid**. Hanya kombinasi inilah yang dihitung pada Beranda, Pemenuhan per Peran, dan Pemenuhan per Kompetensi.

---

# BAB 11 - RINGKASAN ALUR KERJA PER ROLE

## 11.1 Admin Tambun Raya

1. **Reference** - isi/rapikan master data: Jabatan, Jenjang, Fungsi, Peran, lalu Kompetensi beserta mapping (jabatan + jenjang + peran, tandai **Wajib**).
2. **Profil Kompetensi** - tambahkan data pegawai (NIP 18 digit, fungsi, jabatan, jenjang, peran), perbaiki bila ada perubahan, nonaktifkan pegawai yang tidak lagi aktif.
3. **Standar Kompetensi** - periksa hasil pemetaan kompetensi.
4. **Jadwal Pelatihan > Kompetensi Wajib** - tetapkan daftar kompetensi wajib tahun berjalan.
5. **Jadwal Pelatihan > Master Pelatihan** - buat master pelatihan beserta kompetensi terkait.
6. **Jadwal Pelatihan > Jadwal Pelatihan** - buat jadwal, undang peserta, publikasikan, mulai, catat kehadiran, selesaikan, tandai kompetensi terpenuhi.
7. **Jadwal Pelatihan > Pantau** - awasi peserta yang belum mengunggah sertifikat.
8. **Riwayat Pelatihan** - verifikasi sertifikat/bukti kompetensi pegawai (**Lulus + Valid**).
9. **Perencanaan** - unggah dokumen perencanaan pengembangan kompetensi.
10. **Pemenuhan per Peran** dan **Pemenuhan per Kompetensi** - cetak/ekspor laporan pemenuhan (CSV).

## 11.2 Ketua Tim (Katim)

1. **Beranda** - pantau banner pegawai yang belum 100% memenuhi kompetensi wajib dan daftar yang menunggu verifikasi.
2. **Reference** dan **Profil Kompetensi** - lihat data (mode baca).
3. **Jadwal Pelatihan** - buat jadwal, undang peserta, publikasi, mulai, catat kehadiran, selesaikan, tandai kompetensi terpenuhi, dan **Pantau** sertifikat.
4. **Perencanaan** - unggah dan kelola dokumen perencanaan.
5. **Pemenuhan per Peran** dan **Pemenuhan per Kompetensi** - pantau dan ekspor laporan.
6. **Riwayat Pelatihan** - lihat data pegawai di fungsi Anda dan hapus data bila diperlukan.

Katim **tidak** dapat memverifikasi sertifikat dan **tidak** dapat mengubah master data/pegawai.

## 11.3 Pegawai (User)

1. **Beranda** - periksa banner **Kompetensi wajib yang harus Anda penuhi** dan persentase pemenuhan.
2. **Jadwal Pelatihan** - lihat jadwal yang mengundang Anda, buka **Detail** > tab **Status Undangan Saya**, lalu **Terima Undangan** atau **Tolak Undangan**.
3. Ikuti pelatihan. Setelah selesai, **Riwayat Pelatihan > Tambah Kompetensi** - pilih kompetensi, isi tanggal dipenuhi, nilai, status, dan unggah sertifikat (PDF/JPG/PNG maks 2 MB).
4. **Riwayat Pelatihan** - pantau kolom **Status / Hasil** dan **Verifikator**. Bila hasilnya **Tidak Valid** atau **Perlu Revisi**, klik **Edit**, perbaiki, lalu simpan.
5. **Pemenuhan per Peran** dan **Pemenuhan per Kompetensi** - lihat posisi kompetensi Anda dan cari tahu pegawai lain yang sudah bersertifikat.
6. **Standar Kompetensi** - lihat kompetensi yang disyaratkan untuk suatu jabatan/jenjang.

---

# BAB 12 - DAFTAR STATUS DAN ARTINYA

| Konteks | Status | Arti |
| --- | --- | --- |
| **Jadwal Pelatihan** | **Draft** | Baru dibuat; belum terlihat pegawai; undangan belum dapat dikonfirmasi. |
| | **Publik** | Sudah dipublikasikan; pegawai dapat melihat dan merespons undangan. |
| | **Berlangsung** | Pelatihan sedang berjalan; kehadiran dapat dicatat. |
| | **Selesai** | Pelatihan tuntas; kompetensi terpenuhi dan Pantau Sertifikat dapat dijalankan. |
| | **Dibatalkan** | Jadwal dibatalkan. |
| **Undangan** | **Pending** | Menunggu konfirmasi peserta. |
| | **Diterima** | Peserta bersedia hadir. |
| | **Ditolak** | Peserta tidak dapat hadir. |
| **Kehadiran** | **Hadir / Tidak Hadir / Izin / Sakit** | Dicatat Admin Tambun Raya atau Katim saat Berlangsung atau Selesai. |
| **Status Kompetensi** | **Lulus** | Dinyatakan menguasai kompetensi. |
| | **Tidak Lulus** | Tidak lulus. |
| | **Dalam Proses** | Masih dalam proses. |
| **Hasil Verifikasi** | **(kosong)** | Belum Diverifikasi. |
| | **Valid** | Diterima dan sah. |
| | **Tidak Valid** | Ditolak; pegawai dapat memperbaiki. |
| | **Perlu Revisi** | Harus diperbaiki pegawai. |
| **Memenuhi kompetensi** | - | Hanya bila **Lulus** dan **Valid**. |
| **Peserta Lengkap** | **Lengkap (n/m)** | Sudah mengunggah sertifikat untuk semua kompetensi terkait. |
| | **Belum Lengkap (n/m)** | Masih ada kompetensi yang belum diunggah. |
| | **Tanpa Kompetensi** | Pelatihan tidak dikaitkan dengan kompetensi. |

---

# BAB 13 - CATATAN PENTING DAN BATASAN

1. Login hanya melalui **SSO Keycloak**; tidak ada form username/password di aplikasi. Sesi berlaku **4 jam**.
2. Menambah, mengubah, atau menonaktifkan **master data** dan **data pegawai** hanya dapat dilakukan **Admin Tambun Raya**.
3. **Verifikasi sertifikat** hanya dapat dilakukan **Admin Tambun Raya**.
4. Kompetensi dihitung **memenuhi** hanya bila status **Lulus** dan hasil verifikasi **Valid**.
5. Data yang sudah **Valid** terkunci untuk pegawai. Bila terjadi kesalahan, Admin dapat memverifikasi ulang dengan hasil **Tidak Valid** atau **Perlu Revisi** agar pegawai dapat memperbaiki.
6. Memperbaiki data otomatis menghapus hasil verifikasi sebelumnya dan mengembalikan status menjadi **Belum Diverifikasi**.
7. Undangan hanya dapat dikonfirmasi **setelah jadwal dipublikasikan**; jadwal **Draft** belum terlihat oleh pegawai.
8. Jadwal hanya dapat **diedit** saat status **Draft**. **Katim** hanya dapat menghapus jadwal berstatus **Draft**, sedangkan **Admin Tambun Raya** dapat menghapus pada status apa pun (data peserta dan kehadiran ikut terhapus).
9. Batas unggahan: **sertifikat kompetensi** PDF/JPG/PNG maksimal **2 MB**; **dokumen perencanaan** hanya PDF maksimal **20 MB**.
10. Menu **Perencanaan** hanya muncul untuk **Admin Tambun Raya** dan **Katim**.
11. Laporan yang dapat diunduh dalam format **CSV** ada pada halaman **Pemenuhan per Peran** dan **Pemenuhan per Kompetensi**. Tombol **Export Data** pada halaman **Profil Kompetensi** dan tab **Kompetensi (Reference)** belum berfungsi.
12. Halaman **Standar Kompetensi** dan **Reference** bersifat baca-untuk-sebagian-role: pegawai dan Katim hanya melihat, tanpa menambah/mengubah.
13. Data pada **Beranda** diperbarui otomatis setiap **30 detik**.

---

# PENUTUP

Panduan bergambar ini memuat seluruh modul aktif aplikasi TAMBUN RAYA: **Login, Beranda, Reference (Master Data), Standar Kompetensi, Perencanaan, Profil Kompetensi, Pemenuhan per Peran, Pemenuhan per Kompetensi, Jadwal Pelatihan (Jadwal, Master, Kompetensi Wajib), dan Riwayat Pelatihan**, lengkap dengan penjelasan setiap isian untuk role **Admin Tambun Raya**, **Katim**, dan **Pegawai**.

**TAMBUN RAYA - Talenta Aparatur Mumpuni**

**Versi 1.0 - BBPOM di Palangka Raya**
