/**
 * Bank Sampah — Google Apps Script Backend
 */

var SHEETS = {
  WARGA:              'warga',
  RT:                 'rt',
  COLLECTION_BATCH:   'collection_batch',
  SETORAN:            'setoran',
  SALE_BATCH:         'sale_batch',
  DISTRIBUSI:         'distribusi',
  KAS_KARANG_TARUNA:  'kas_karang_taruna',
  SALDO:              'saldo',
};

var DRIVE_FOLDER_NAME = 'Bank Sampah - Nota';

// ─────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────

function doPost(e) {
  var result;
  try {
    var payload = JSON.parse(e.postData.contents);
    var action  = payload.action;
    var data    = payload.payload || {};

    switch (action) {
      case 'getWarga':             result = getWarga(); break;
      case 'addWarga':             result = addWarga(data); break;
      case 'updateWarga':          result = updateWarga(data); break;

      case 'getRt':                result = getRt(); break;
      case 'addRt':                result = addRt(data); break;
      case 'updateRt':             result = updateRt(data); break;
      case 'deleteRt':             result = deleteRt(data); break;

      case 'getCollectionBatches': result = getCollectionBatches(); break;
      case 'addCollectionBatch':   result = addCollectionBatch(data); break;

      case 'getSetoran':           result = getSetoran(data); break;
      case 'addSetoran':           result = addSetoran(data); break;
      case 'deleteSetoran':        result = deleteSetoran(data); break;

      case 'getSaleBatches':       result = getSaleBatches(); break;
      case 'addSaleBatch':         result = addSaleBatch(data); break;

      case 'uploadFile':           result = uploadFile(data); break;

      case 'getDistribusi':        result = getDistribusi(data); break;
      case 'getSaldo':             result = getSaldo(data); break;
      case 'getKasKarangTaruna':   result = getKasKarangTaruna(); break;
      case 'getDashboardStats':    result = getDashboardStats(); break;
      case 'getWargaDetail':       result = getWargaDetail(data); break;

      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Bank Sampah API running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheetDefs = [
    { name: SHEETS.WARGA,             headers: ['id','nama','rt','nomor_hp','aktif','created_at'] },
    { name: SHEETS.RT,                headers: ['id','nama'] },
    { name: SHEETS.COLLECTION_BATCH,  headers: ['id','tanggal','status'] },
    { name: SHEETS.SETORAN,           headers: ['id','batch_id','warga_id','berat_kg'] },
    { name: SHEETS.SALE_BATCH,        headers: ['id','tanggal_jual','collection_batch_ids','total_kg','total_penjualan','harga_per_kg','nota_url','total_setoran_kg','hak_warga_total'] },
    { name: SHEETS.DISTRIBUSI,        headers: ['id','sale_id','warga_id','berat','persentase','saldo'] },
    { name: SHEETS.KAS_KARANG_TARUNA, headers: ['id','sale_id','nominal'] },
    { name: SHEETS.SALDO,             headers: ['warga_id','total_saldo'] },
  ];

  sheetDefs.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);
    if (!sheet) sheet = ss.insertSheet(def.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(def.headers);
      sheet.getRange(1, 1, 1, def.headers.length)
           .setFontWeight('bold')
           .setBackground('#16a34a')
           .setFontColor('#ffffff');
    }
  });

  getOrCreateFolder();
  Logger.log('Setup selesai! Semua sheet sudah dibuat.');
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function generateId(prefix, sheet) {
  var rows = sheetToObjects(sheet);
  var nums = rows
    .map(function(r) { return parseInt(String(r.id).replace(prefix, ''), 10); })
    .filter(function(n) { return !isNaN(n); });
  var next = nums.length > 0 ? Math.max.apply(null, nums) + 1 : 1;
  return prefix + String(next).padStart(3, '0');
}

function uuid() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

// ─────────────────────────────────────────────────────────────
// GOOGLE DRIVE
// ─────────────────────────────────────────────────────────────

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  var folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

// ─────────────────────────────────────────────────────────────
// UPLOAD FILE
// ─────────────────────────────────────────────────────────────

function uploadFile(data) {
  try {
    if (!data.base64 || !data.mimeType || !data.fileName) {
      return { status: 'error', message: 'Data file tidak lengkap' };
    }

    var now      = new Date();
    var dd       = String(now.getDate()).padStart(2, '0');
    var mm       = String(now.getMonth() + 1).padStart(2, '0');
    var yyyy     = now.getFullYear();
    var hh       = String(now.getHours()).padStart(2, '0');
    var min      = String(now.getMinutes()).padStart(2, '0');
    var ss       = String(now.getSeconds()).padStart(2, '0');
    var ext      = data.fileName.split('.').pop();
    var fileName = 'nota-' + dd + '-' + mm + '-' + yyyy + '_' + hh + '-' + min + '-' + ss + '.' + ext;

    var decoded  = Utilities.base64Decode(data.base64);
    var blob     = Utilities.newBlob(decoded, data.mimeType, fileName);
    var folder   = getOrCreateFolder();
    var file     = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId   = file.getId();
    return {
      status: 'success',
      data: {
        url:      'https://drive.google.com/file/d/' + fileId + '/view',
        thumb:    'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400',
        fileId:   fileId,
        fileName: fileName,
      }
    };
  } catch (err) {
    return { status: 'error', message: 'Upload gagal: ' + err.toString() };
  }
}

// ─────────────────────────────────────────────────────────────
// RT — CRUD
// ─────────────────────────────────────────────────────────────

function getRt() {
  var sheet = getSheet(SHEETS.RT);
  var rows  = sheetToObjects(sheet);
  // Urutkan: RT 01, RT 02, dst
  rows.sort(function(a, b) { return String(a.nama).localeCompare(String(b.nama)); });
  return { status: 'success', data: rows };
}

function addRt(data) {
  if (!data.nama) {
    return { status: 'error', message: 'Nama RT wajib diisi' };
  }

  // Validasi format: harus "RT XX" (XX = 2 digit angka)
  var formatValid = /^RT \d{2}$/.test(data.nama.trim());
  if (!formatValid) {
    return { status: 'error', message: 'Format RT tidak valid. Gunakan format "RT 01", "RT 02", dst.' };
  }

  // Cek duplikat
  var sheet    = getSheet(SHEETS.RT);
  var existing = sheetToObjects(sheet);
  var duplikat = existing.find(function(r) {
    return r.nama.trim().toLowerCase() === data.nama.trim().toLowerCase();
  });
  if (duplikat) {
    return { status: 'error', message: data.nama + ' sudah terdaftar' };
  }

  var id = uuid();
  sheet.appendRow([id, data.nama.trim()]);
  return { status: 'success', data: { id: id, nama: data.nama.trim() } };
}

function updateRt(data) {
  if (!data.id || !data.nama) {
    return { status: 'error', message: 'ID dan nama RT wajib diisi' };
  }

  // Validasi format
  var formatValid = /^RT \d{2}$/.test(data.nama.trim());
  if (!formatValid) {
    return { status: 'error', message: 'Format RT tidak valid. Gunakan format "RT 01", "RT 02", dst.' };
  }

  var sheet = getSheet(SHEETS.RT);
  var rows  = sheet.getDataRange().getValues();
  var headers = rows[0];

  // Cek duplikat (kecuali dirinya sendiri)
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== String(data.id) &&
        String(rows[i][1]).trim().toLowerCase() === data.nama.trim().toLowerCase()) {
      return { status: 'error', message: data.nama + ' sudah terdaftar' };
    }
  }

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      rows[i][headers.indexOf('nama')] = data.nama.trim();
      sheet.getRange(i + 1, 1, 1, rows[i].length).setValues([rows[i]]);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'RT tidak ditemukan' };
}

function deleteRt(data) {
  if (!data.id) {
    return { status: 'error', message: 'ID RT wajib diisi' };
  }

  // Cari nama RT yang akan dihapus
  var rtSheet = getSheet(SHEETS.RT);
  var rtRows  = sheetToObjects(rtSheet);
  var rtData  = rtRows.find(function(r) { return String(r.id) === String(data.id); });
  if (!rtData) {
    return { status: 'error', message: 'RT tidak ditemukan' };
  }

  // Cek apakah masih ada warga aktif di RT ini
  var wargaSheet = getSheet(SHEETS.WARGA);
  var wargaRows  = sheetToObjects(wargaSheet);
  var wargaDiRt  = wargaRows.filter(function(w) {
    return String(w.rt).trim().toLowerCase() === String(rtData.nama).trim().toLowerCase()
      && w.aktif !== false && w.aktif !== 'FALSE';
  });

  if (wargaDiRt.length > 0) {
    return {
      status:  'error',
      message: 'Tidak dapat menghapus ' + rtData.nama + ' karena masih ada '
               + wargaDiRt.length + ' warga aktif di RT ini. '
               + 'Pindahkan atau nonaktifkan warga tersebut terlebih dahulu.'
    };
  }

  // Hapus baris RT
  var rtData2 = rtSheet.getDataRange().getValues();
  for (var i = 1; i < rtData2.length; i++) {
    if (String(rtData2[i][0]) === String(data.id)) {
      rtSheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'RT tidak ditemukan' };
}

// ─────────────────────────────────────────────────────────────
// WARGA
// ─────────────────────────────────────────────────────────────

function getWarga() {
  var sheet = getSheet(SHEETS.WARGA);
  var rows  = sheetToObjects(sheet);
  rows = rows.map(function(r) {
    r.aktif = r.aktif !== false && r.aktif !== 'FALSE';
    return r;
  });
  return { status: 'success', data: rows };
}

function addWarga(data) {
  var sheet = getSheet(SHEETS.WARGA);
  var id    = uuid();
  var now   = new Date().toISOString();
  sheet.appendRow([id, data.nama, data.rt, data.nomor_hp || '', true, now]);
  return { status: 'success', data: { id: id } };
}

function updateWarga(data) {
  var sheet   = getSheet(SHEETS.WARGA);
  var rows    = sheet.getDataRange().getValues();
  var headers = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      if (data.nama     !== undefined) rows[i][headers.indexOf('nama')]     = data.nama;
      if (data.rt       !== undefined) rows[i][headers.indexOf('rt')]       = data.rt;
      if (data.nomor_hp !== undefined) rows[i][headers.indexOf('nomor_hp')] = data.nomor_hp;
      if (data.aktif    !== undefined) rows[i][headers.indexOf('aktif')]    = data.aktif;
      sheet.getRange(i + 1, 1, 1, rows[i].length).setValues([rows[i]]);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'Warga tidak ditemukan' };
}

// ─────────────────────────────────────────────────────────────
// COLLECTION BATCH
// ─────────────────────────────────────────────────────────────

function getCollectionBatches() {
  var sheet = getSheet(SHEETS.COLLECTION_BATCH);
  return { status: 'success', data: sheetToObjects(sheet) };
}

function addCollectionBatch(data) {
  var sheet = getSheet(SHEETS.COLLECTION_BATCH);
  var id    = generateId('C', sheet);
  sheet.appendRow([id, data.tanggal, 'pending']);
  return { status: 'success', data: { id: id } };
}

function markBatchesSold(batchIds) {
  var sheet     = getSheet(SHEETS.COLLECTION_BATCH);
  var rows      = sheet.getDataRange().getValues();
  var headers   = rows[0];
  var statusCol = headers.indexOf('status');
  var idCol     = headers.indexOf('id');
  for (var i = 1; i < rows.length; i++) {
    if (batchIds.indexOf(String(rows[i][idCol])) !== -1) {
      rows[i][statusCol] = 'sold';
      sheet.getRange(i + 1, 1, 1, rows[i].length).setValues([rows[i]]);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SETORAN
// ─────────────────────────────────────────────────────────────

function getSetoran(data) {
  var sheet      = getSheet(SHEETS.SETORAN);
  var wargaSheet = getSheet(SHEETS.WARGA);
  var rows       = sheetToObjects(sheet);
  var wargaRows  = sheetToObjects(wargaSheet);

  if (data.batch_id) {
    rows = rows.filter(function(r) { return r.batch_id === data.batch_id; });
  }

  rows = rows.map(function(r) {
    var w        = wargaRows.find(function(w) { return String(w.id) === String(r.warga_id); });
    r.warga_nama = w ? w.nama : r.warga_id;
    r.warga_rt   = w ? w.rt   : '';
    r.berat_kg   = parseFloat(r.berat_kg) || 0;
    return r;
  });

  return { status: 'success', data: rows };
}

function addSetoran(data) {
  var sheet = getSheet(SHEETS.SETORAN);
  var id    = uuid();
  sheet.appendRow([id, data.batch_id, data.warga_id, parseFloat(data.berat_kg)]);
  return { status: 'success', data: { id: id } };
}

function deleteSetoran(data) {
  var sheet = getSheet(SHEETS.SETORAN);
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'Setoran tidak ditemukan' };
}

// ─────────────────────────────────────────────────────────────
// SALE BATCH
// ─────────────────────────────────────────────────────────────

function getSaleBatches() {
  var sheet = getSheet(SHEETS.SALE_BATCH);
  var rows  = sheetToObjects(sheet);
  rows = rows.map(function(r) {
    r.total_kg         = parseFloat(r.total_kg) || 0;
    r.total_penjualan  = parseFloat(r.total_penjualan) || 0;
    r.harga_per_kg     = parseFloat(r.harga_per_kg) || 0;
    r.total_setoran_kg = parseFloat(r.total_setoran_kg) || 0;
    r.hak_warga_total  = parseFloat(r.hak_warga_total) || 0;
    return r;
  });
  return { status: 'success', data: rows };
}

function addSaleBatch(data) {
  var batchIds       = data.collection_batch_ids.split(',').map(function(s) { return s.trim(); });
  var totalKgTerjual = parseFloat(data.total_kg);
  var totalPenjualan = parseFloat(data.total_penjualan);
  var hargaPerKg     = totalKgTerjual > 0 ? Math.round(totalPenjualan / totalKgTerjual) : 0;
  var notaUrl        = data.nota_url || '';
  var tanggalJual    = data.tanggal_jual || new Date().toISOString().split('T')[0];

  var setoranSheet = getSheet(SHEETS.SETORAN);
  var allSetoran   = sheetToObjects(setoranSheet).filter(function(s) {
    return batchIds.indexOf(String(s.batch_id)) !== -1;
  });

  var wargaKg   = {};
  var totalKgDB = 0;
  allSetoran.forEach(function(s) {
    var wid      = String(s.warga_id);
    var berat    = parseFloat(s.berat_kg) || 0;
    wargaKg[wid] = (wargaKg[wid] || 0) + berat;
    totalKgDB   += berat;
  });

  // Hak warga = 50% dari (total setoran DB × harga/kg)
  var hakWargaTotal = Math.round(totalKgDB * hargaPerKg * 0.5);

  var saleSheet = getSheet(SHEETS.SALE_BATCH);
  var saleId    = generateId('P', saleSheet);
  saleSheet.appendRow([
    saleId, tanggalJual, batchIds.join(','),
    totalKgTerjual, totalPenjualan, hargaPerKg, notaUrl,
    totalKgDB, hakWargaTotal
  ]);

  var distribusiSheet = getSheet(SHEETS.DISTRIBUSI);
  var saldoSheet      = getSheet(SHEETS.SALDO);
  var saldoRows       = sheetToObjects(saldoSheet);

  Object.keys(wargaKg).forEach(function(wargaId) {
    var berat      = wargaKg[wargaId];
    var persentase = totalKgDB > 0 ? Math.round((berat / totalKgDB) * 10000) / 100 : 0;
    var saldo      = totalKgDB > 0 ? Math.round((berat / totalKgDB) * hakWargaTotal) : 0;

    distribusiSheet.appendRow([uuid(), saleId, wargaId, berat, persentase, saldo]);

    var existing = saldoRows.find(function(r) { return String(r.warga_id) === String(wargaId); });
    if (existing) {
      var saldoData     = saldoSheet.getDataRange().getValues();
      var saldoHeaders  = saldoData[0];
      var wargaIdCol    = saldoHeaders.indexOf('warga_id');
      var totalSaldoCol = saldoHeaders.indexOf('total_saldo');
      for (var i = 1; i < saldoData.length; i++) {
        if (String(saldoData[i][wargaIdCol]) === String(wargaId)) {
          saldoData[i][totalSaldoCol] = (parseFloat(saldoData[i][totalSaldoCol]) || 0) + saldo;
          saldoSheet.getRange(i + 1, 1, 1, saldoData[i].length).setValues([saldoData[i]]);
          break;
        }
      }
    } else {
      saldoSheet.appendRow([wargaId, saldo]);
      saldoRows.push({ warga_id: wargaId, total_saldo: saldo });
    }
  });

  // Kas KT = total penjualan aktual - hak warga
  var kasKT    = Math.round(totalPenjualan - hakWargaTotal);
  var kasSheet = getSheet(SHEETS.KAS_KARANG_TARUNA);
  kasSheet.appendRow([uuid(), saleId, kasKT]);

  markBatchesSold(batchIds);

  return {
    status: 'success',
    data: {
      id:               saleId,
      total_setoran_kg: totalKgDB,
      hak_warga_total:  hakWargaTotal,
      kas_kt:           kasKT,
    }
  };
}

// ─────────────────────────────────────────────────────────────
// DISTRIBUSI & KAS
// ─────────────────────────────────────────────────────────────

function getDistribusi(data) {
  var sheet      = getSheet(SHEETS.DISTRIBUSI);
  var wargaSheet = getSheet(SHEETS.WARGA);
  var rows       = sheetToObjects(sheet);
  var wargaRows  = sheetToObjects(wargaSheet);

  if (data && data.sale_id) {
    rows = rows.filter(function(r) { return r.sale_id === data.sale_id; });
  }

  rows = rows.map(function(r) {
    var w        = wargaRows.find(function(w) { return String(w.id) === String(r.warga_id); });
    r.warga_nama = w ? w.nama : r.warga_id;
    r.warga_rt   = w ? w.rt   : '';
    r.berat      = parseFloat(r.berat) || 0;
    r.persentase = parseFloat(r.persentase) || 0;
    r.saldo      = parseFloat(r.saldo) || 0;
    return r;
  });

  return { status: 'success', data: rows };
}

function getSaldo(data) {
  var sheet      = getSheet(SHEETS.SALDO);
  var wargaSheet = getSheet(SHEETS.WARGA);
  var rows       = sheetToObjects(sheet);
  var wargaRows  = sheetToObjects(wargaSheet);

  rows = rows.map(function(r) {
    var w         = wargaRows.find(function(w) { return String(w.id) === String(r.warga_id); });
    r.warga_nama  = w ? w.nama : r.warga_id;
    r.warga_rt    = w ? w.rt   : '';
    r.total_saldo = parseFloat(r.total_saldo) || 0;
    return r;
  });

  return { status: 'success', data: rows };
}

function getKasKarangTaruna() {
  var sheet = getSheet(SHEETS.KAS_KARANG_TARUNA);
  var rows  = sheetToObjects(sheet);
  rows = rows.map(function(r) {
    r.nominal = parseFloat(r.nominal) || 0;
    return r;
  });
  return { status: 'success', data: rows };
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────

function getDashboardStats() {
  var wargaRows   = sheetToObjects(getSheet(SHEETS.WARGA));
  var setoranRows = sheetToObjects(getSheet(SHEETS.SETORAN));
  var saleRows    = sheetToObjects(getSheet(SHEETS.SALE_BATCH));
  var kasRows     = sheetToObjects(getSheet(SHEETS.KAS_KARANG_TARUNA));
  var saldoRows   = sheetToObjects(getSheet(SHEETS.SALDO));
  var batchRows   = sheetToObjects(getSheet(SHEETS.COLLECTION_BATCH));

  var activeWarga  = wargaRows.filter(function(w) { return w.aktif !== false && w.aktif !== 'FALSE'; });
  var totalSampah  = setoranRows.reduce(function(s, r) { return s + (parseFloat(r.berat_kg) || 0); }, 0);
  var totalJual    = saleRows.reduce(function(s, r)    { return s + (parseFloat(r.total_penjualan) || 0); }, 0);
  var totalKas     = kasRows.reduce(function(s, r)     { return s + (parseFloat(r.nominal) || 0); }, 0);
  var totalSaldo   = saldoRows.reduce(function(s, r)   { return s + (parseFloat(r.total_saldo) || 0); }, 0);
  var pendingCount = batchRows.filter(function(b) { return b.status === 'pending'; }).length;

  return {
    status: 'success',
    data: {
      total_warga:             activeWarga.length,
      total_sampah_kg:         Math.round(totalSampah * 100) / 100,
      total_penjualan:         Math.round(totalJual),
      total_kas_karang_taruna: Math.round(totalKas),
      total_saldo_warga:       Math.round(totalSaldo),
      batch_pending_count:     pendingCount,
      last_updated:            new Date().toISOString(),
    }
  };
}

// ─────────────────────────────────────────────────────────────
// WARGA DETAIL
// ─────────────────────────────────────────────────────────────

function getWargaDetail(data) {
  var wargaId     = String(data.warga_id);
  var wargaRows   = sheetToObjects(getSheet(SHEETS.WARGA));
  var setoranRows = sheetToObjects(getSheet(SHEETS.SETORAN));
  var distribRows = sheetToObjects(getSheet(SHEETS.DISTRIBUSI));
  var saldoRows   = sheetToObjects(getSheet(SHEETS.SALDO));

  var warga = wargaRows.find(function(w) { return String(w.id) === wargaId; });
  if (!warga) return { status: 'error', message: 'Warga tidak ditemukan' };

  var mySetoran = setoranRows.filter(function(s) { return String(s.warga_id) === wargaId; });
  var myDistrib = distribRows.filter(function(d) { return String(d.warga_id) === wargaId; });
  var mySaldo   = saldoRows.find(function(s)     { return String(s.warga_id) === wargaId; });
  var totalKg   = mySetoran.reduce(function(s, r) { return s + (parseFloat(r.berat_kg) || 0); }, 0);

  return {
    status: 'success',
    data: {
      warga:              warga,
      saldo:              mySaldo ? parseFloat(mySaldo.total_saldo) || 0 : 0,
      total_setoran_kg:   Math.round(totalKg * 100) / 100,
      riwayat_setoran:    mySetoran,
      riwayat_distribusi: myDistrib.map(function(d) {
        d.berat      = parseFloat(d.berat) || 0;
        d.persentase = parseFloat(d.persentase) || 0;
        d.saldo      = parseFloat(d.saldo) || 0;
        return d;
      }),
    }
  };
}
