  /**
   * GOOGLE APPS SCRIPT - BUKU TAMU & RSVP PERNIKAHAN NETTY & BAYU
   * Spreadsheet ID: 1oYl46WZ-61yEJQ47Noa9ehlTQSKbVa3mcd4z43D66Vc
   * Nama Sheet: Sheet1
   *
   * Kolom yang dihasilkan:
   * 1. timestamp
   * 2. nama tamu
   * 3. ucapan
   * 4. konfirmasi kehadiran
   * 5. jumlah tamu
   *
   * CARA PEMASANGAN:
   * 1. Buka spreadsheet: https://docs.google.com/spreadsheets/d/1oYl46WZ-61yEJQ47Noa9ehlTQSKbVa3mcd4z43D66Vc/edit#gid=0
   * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
   * 3. Hapus semua kode bawaan, lalu salin (copy) dan tempel (paste) seluruh isi file ini.
   * 4. Klik ikon "Simpan" (Save).
   * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > pilih "Penerapan baru" (New deployment).
   * 6. Pada bagian jenis, pilih "Aplikasi Web" (Web app).
   * 7. Isi:
   *    - Deskripsi: RSVP & Ucapan Netty Bayu
   *    - Jalankan sebagai (Execute as): Saya (Me)
   *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone) -> SANGAT PENTING!
   * 8. Klik "Terapkan" (Deploy). Berikan izin akses (Authorize access) jika diminta.
   * 9. Salin URL Aplikasi Web yang diberikan (berakhiran /exec) dan masukkan ke variabel GOOGLE_SCRIPT_URL di index.html.
   */

  const SPREADSHEET_ID = "1oYl46WZ-61yEJQ47Noa9ehlTQSKbVa3mcd4z43D66Vc";
  const SHEET_NAME = "Sheet1";

  // 1. GET: Mengambil data seluruh ucapan untuk ditampilkan di website
  function doGet(e) {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
      
      // Pastikan header sheet sudah tersedia
      setupSheetHeader(sheet);
      
      const values = sheet.getDataRange().getValues();
      const result = [];
      
      // Baris 0 adalah header, mulai membaca data dari baris 1
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const nama = String(row[1] || "").trim();
        const ucapan = String(row[2] || "").trim();
        
        // Lewati baris kosong
        if (!nama && !ucapan) continue;
        
        let waktuFormatted = "";
        if (row[0] instanceof Date) {
          waktuFormatted = Utilities.formatDate(row[0], "Asia/Jakarta", "dd MMM yyyy, HH:mm");
        } else {
          waktuFormatted = String(row[0] || "");
        }
        
        result.push({
          timestamp: waktuFormatted,
          nama: nama,
          ucapan: ucapan,
          kehadiran: String(row[3] || "Hadir").trim(),
          jumlah_tamu: String(row[4] || "1").trim()
        });
      }
      
      // Tampilkan ucapan terbaru di urutan paling atas
      result.reverse();
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        total: result.length,
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
      
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 2. POST: Menyimpan ucapan & konfirmasi kehadiran baru dari website
  function doPost(e) {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
      
      setupSheetHeader(sheet);
      
      let params = {};
      if (e.postData && e.postData.contents) {
        try {
          params = JSON.parse(e.postData.contents);
        } catch (ex) {
          params = e.parameter || {};
        }
      } else {
        params = e.parameter || {};
      }
      
      const now = new Date();
      const nama = (params.nama || params.author || "").trim() || "Anonim";
      const ucapan = (params.ucapan || params.comment || "").trim();
      let kehadiran = (params.kehadiran || params.attendance || "").trim();
      let jumlahTamu = (params.jumlah_tamu || params.guest || "1").trim();
      
      // Normalisasi status kehadiran
      if (kehadiran.toLowerCase() === "present" || (kehadiran.toLowerCase().includes("hadir") && !kehadiran.toLowerCase().includes("tidak"))) {
        kehadiran = "Hadir";
      } else if (kehadiran.toLowerCase() === "notpresent" || kehadiran.toLowerCase().includes("tidak")) {
        kehadiran = "Tidak Hadir";
        jumlahTamu = "0";
      } else {
        kehadiran = "Hadir";
      }
      
      if (!ucapan) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Ucapan tidak boleh kosong."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Masukkan baris baru ke Sheet1 sesuai urutan 5 kolom
      sheet.appendRow([now, nama, ucapan, kehadiran, jumlahTamu]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Ucapan berhasil disimpan!",
        data: {
          timestamp: Utilities.formatDate(now, "Asia/Jakarta", "dd MMM yyyy, HH:mm"),
          nama: nama,
          ucapan: ucapan,
          kehadiran: kehadiran,
          jumlah_tamu: jumlahTamu
        }
      })).setMimeType(ContentService.MimeType.JSON);
      
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Menyiapkan judul kolom jika sheet baru dibuat atau kosong
  function setupSheetHeader(sheet) {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["timestamp", "nama tamu", "ucapan", "konfirmasi kehadiran", "jumlah tamu"]);
      const headerRange = sheet.getRange(1, 1, 1, 5);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#768CB3");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
  }
