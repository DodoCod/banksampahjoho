/**
 * Bank Sampah — Google Apps Script Backend
 * 
 * CARA SETUP:
 * 1. Buka script.google.com → New Project
 * 2. Paste seluruh kode ini
 * 3. Jalankan fungsi setupSheets() SATU KALI untuk membuat semua sheet
 * 4. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy URL deployment → paste ke .env.local sebagai GOOGLE_SCRIPT_URL
 */

// ─────────────────────────────────────────────────────────────
// SHEET NAMES
// ─────────────────────────────────────────────────────────────
var SHEETS = {
  WARGA:              'warga',
  COLLECTION_BATCH:   'collection_batch',
  SETORAN:            'setoran',
  SALE_BATCH:         'sale_batch',
  DISTRIBUSI:         'distribusi',
  KAS_KARANG_TARUNA:  'kas_karang_taruna',
  SALDO:              'saldo',
};

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
      // Warga
      case 'getWarga':             result = getWarga(); break;
      case 'addWarga':             result = addWarga(data); break;
      case 'updateWarga':          result = updateWarga(data); break;
      
      // Collection Batch
      case 'getCollectionBatches': result = getCollectionBatches(); break;
      case 'addCollectionBatch':   result = addCollectionBatch(data); break;
      
      // Setoran
      case 'getSetoran':           result = getSetoran(data); break;
      case 'addSetoran':           result = addSetoran(data); break;
      case 'deleteSetoran':        result = deleteSetoran(data); break;
      
      // Sale Batch + distribusi otomatis
      case 'getSaleBatches':       result = getSaleBatches(); break;
      case 'addSaleBatch':         result = addSaleBatch(data); break;
      
      // Read-only
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
  // Health check
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Bank Sampah API running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────────
// SETUP — run once to create all sheets with headers
// ─────────────────────────────────────────────────────────────

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheetDefs = [
    { name: SHEETS.WARGA,             headers: ['id','nama','rt','nomor_hp','aktif','created_at'] },
    { name: SHEETS.COLLECTION_BATCH,  headers: ['id','tanggal','status'] },
    { name: SHEETS.SETORAN,           headers: ['id','batch_id','warga_id','berat_kg'] },
    { name: SHEETS.SALE_BATCH,        headers: ['id','tanggal_jual','collection_batch_ids','total_kg','total_penjualan','harga_per_kg','nota_url'] },
    { name: SHEETS.DISTRIBUSI,        headers: ['id','sale_id','warga_id','berat','persentase','saldo'] },
    { name: SHEETS.KAS_KARANG_TARUNA, headers: ['id','sale_id','nominal'] },
    { name: SHEETS.SALDO,             headers: ['warga_id','total_saldo'] },
  ];
  
  sheetDefs.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
    }
    // Write headers only if row 1 is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(def.headers);
      sheet.getRange(1, 1, 1, def.headers.length)
           .setFontWeight('bold')
           .setBackground('#16a34a')
           .setFontColor('#ffffff');
    }
  });
  
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
// WARGA
// ─────────────────────────────────────────────────────────────

function getWarga() {
  var sheet = getSheet(SHEETS.WARGA);
  var rows = sheetToObjects(sheet);
  // Convert aktif field
  rows = rows.map(function(r) {
    r.aktif = r.aktif !== false && r.aktif !== 'FALSE' && r.aktif !== false;
    return r;
  });
  return { status: 'success', data: rows };
}

function addWarga(data) {
  var sheet = getSheet(SHEETS.WARGA);
  var id = uuid();
  var now = new Date().toISOString();
  sheet.appendRow([id, data.nama, data.rt, data.nomor_hp || '', true, now]);
  return { status: 'success', data: { id: id } };
}

function updateWarga(data) {
  var sheet = getSheet(SHEETS.WARGA);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      if (data.nama    !== undefined) rows[i][headers.indexOf('nama')]     = data.nama;
      if (data.rt      !== undefined) rows[i][headers.indexOf('rt')]       = data.rt;
      if (data.nomor_hp!== undefined) rows[i][headers.indexOf('nomor_hp')] = data.nomor_hp;
      if (data.aktif   !== undefined) rows[i][headers.indexOf('aktif')]    = data.aktif;
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
  var rows = sheetToObjects(sheet);
  return { status: 'success', data: rows };
}

function addCollectionBatch(data) {
  var sheet = getSheet(SHEETS.COLLECTION_BATCH);
  var id = generateId('C', sheet);
  sheet.appendRow([id, data.tanggal, 'pending']);
  return { status: 'success', data: { id: id } };
}

function markBatchesSold(batchIds) {
  var sheet = getSheet(SHEETS.COLLECTION_BATCH);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var statusCol = headers.indexOf('status');
  var idCol = headers.indexOf('id');
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
  var sheet = getSheet(SHEETS.SETORAN);
  var wargaSheet = getSheet(SHEETS.WARGA);
  var rows = sheetToObjects(sheet);
  var wargaRows = sheetToObjects(wargaSheet);
  
  // Filter by batch_id if provided
  if (data.batch_id) {
    rows = rows.filter(function(r) { return r.batch_id === data.batch_id; });
  }
  
  // Join warga name
  rows = rows.map(function(r) {
    var w = wargaRows.find(function(w) { return String(w.id) === String(r.warga_id); });
    r.warga_nama = w ? w.nama : r.warga_id;
    r.warga_rt   = w ? w.rt   : '';
    r.berat_kg   = parseFloat(r.berat_kg) || 0;
    return r;
  });
  
  return { status: 'success', data: rows };
}

function addSetoran(data) {
  var sheet = getSheet(SHEETS.SETORAN);
  var id = uuid();
  sheet.appendRow([id, data.batch_id, data.warga_id, parseFloat(data.berat_kg)]);
  return { status: 'success', data: { id: id } };
}

function deleteSetoran(data) {
  var sheet = getSheet(SHEETS.SETORAN);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'Setoran tidak ditemukan' };
}

// ─────────────────────────────────────────────────────────────
// SALE BATCH — the most complex function
// Creates sale + distribusi + kas + updates saldo, all atomically
// ─────────────────────────────────────────────────────────────

function getSaleBatches() {
  var sheet = getSheet(SHEETS.SALE_BATCH);
  var rows = sheetToObjects(sheet);
  rows = rows.map(function(r) {
    r.total_kg         = parseFloat(r.total_kg) || 0;
    r.total_penjualan  = parseFloat(r.total_penjualan) || 0;
    r.harga_per_kg     = parseFloat(r.harga_per_kg) || 0;
    return r;
  });
  return { status: 'success', data: rows };
}

function addSaleBatch(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var batchIds        = data.collection_batch_ids.split(',').map(function(s) { return s.trim(); });
  var totalKg         = parseFloat(data.total_kg);
  var totalPenjualan  = parseFloat(data.total_penjualan);
  var hargaPerKg      = totalKg > 0 ? Math.round(totalPenjualan / totalKg) : 0;
  var notaUrl         = data.nota_url || '';
  var tanggalJual     = data.tanggal_jual || new Date().toISOString().split('T')[0];
  
  // 1. Create sale batch record
  var saleSheet = getSheet(SHEETS.SALE_BATCH);
  var saleId    = generateId('P', saleSheet);
  saleSheet.appendRow([
    saleId,
    tanggalJual,
    batchIds.join(','),
    totalKg,
    totalPenjualan,
    hargaPerKg,
    notaUrl,
  ]);
  
  // 2. Get all setoran for these batches
  var setoranSheet = getSheet(SHEETS.SETORAN);
  var allSetoran   = sheetToObjects(setoranSheet).filter(function(s) {
    return batchIds.indexOf(String(s.batch_id)) !== -1;
  });
  
  // 3. Group by warga → sum kg
  var wargaKg = {};
  allSetoran.forEach(function(s) {
    var wid = String(s.warga_id);
    wargaKg[wid] = (wargaKg[wid] || 0) + parseFloat(s.berat_kg);
  });
  
  // 4. Dana warga = 50%
  var danaWarga = totalPenjualan * 0.5;
  
  // 5. Create distribusi per warga
  var distribusiSheet = getSheet(SHEETS.DISTRIBUSI);
  var saldoSheet      = getSheet(SHEETS.SALDO);
  var saldoRows       = sheetToObjects(saldoSheet);
  
  Object.keys(wargaKg).forEach(function(wargaId) {
    var berat      = wargaKg[wargaId];
    var persentase = totalKg > 0 ? Math.round((berat / totalKg) * 10000) / 100 : 0;
    var saldo      = totalKg > 0 ? Math.round((berat / totalKg) * danaWarga) : 0;
    
    // Add distribusi row
    distribusiSheet.appendRow([uuid(), saleId, wargaId, berat, persentase, saldo]);
    
    // Update or insert saldo
    var existing = saldoRows.find(function(r) { return String(r.warga_id) === String(wargaId); });
    if (existing) {
      // Update existing row
      var saldoData = saldoSheet.getDataRange().getValues();
      var saldoHeaders = saldoData[0];
      var wargaIdCol = saldoHeaders.indexOf('warga_id');
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
  
  // 6. Kas Karang Taruna = 50%
  var kasSheet = getSheet(SHEETS.KAS_KARANG_TARUNA);
  kasSheet.appendRow([uuid(), saleId, Math.round(totalPenjualan * 0.5)]);
  
  // 7. Mark collection batches as sold
  markBatchesSold(batchIds);
  
  return { status: 'success', data: { id: saleId } };
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
    var w = wargaRows.find(function(w) { return String(w.id) === String(r.warga_id); });
    r.warga_nama  = w ? w.nama : r.warga_id;
    r.warga_rt    = w ? w.rt   : '';
    r.berat       = parseFloat(r.berat) || 0;
    r.persentase  = parseFloat(r.persentase) || 0;
    r.saldo       = parseFloat(r.saldo) || 0;
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
    var w = wargaRows.find(function(w) { return String(w.id) === String(r.warga_id); });
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
  var wargaRows    = sheetToObjects(getSheet(SHEETS.WARGA));
  var setoranRows  = sheetToObjects(getSheet(SHEETS.SETORAN));
  var saleRows     = sheetToObjects(getSheet(SHEETS.SALE_BATCH));
  var kasRows      = sheetToObjects(getSheet(SHEETS.KAS_KARANG_TARUNA));
  var saldoRows    = sheetToObjects(getSheet(SHEETS.SALDO));
  var batchRows    = sheetToObjects(getSheet(SHEETS.COLLECTION_BATCH));
  
  var activeWarga  = wargaRows.filter(function(w) {
    return w.aktif !== false && w.aktif !== 'FALSE';
  });
  
  var totalSampah  = setoranRows.reduce(function(s, r) { return s + (parseFloat(r.berat_kg) || 0); }, 0);
  var totalJual    = saleRows.reduce(function(s, r)   { return s + (parseFloat(r.total_penjualan) || 0); }, 0);
  var totalKas     = kasRows.reduce(function(s, r)    { return s + (parseFloat(r.nominal) || 0); }, 0);
  var totalSaldo   = saldoRows.reduce(function(s, r)  { return s + (parseFloat(r.total_saldo) || 0); }, 0);
  var pendingCount = batchRows.filter(function(b) { return b.status === 'pending'; }).length;
  
  return {
    status: 'success',
    data: {
      total_warga:              activeWarga.length,
      total_sampah_kg:          Math.round(totalSampah * 100) / 100,
      total_penjualan:          Math.round(totalJual),
      total_kas_karang_taruna:  Math.round(totalKas),
      total_saldo_warga:        Math.round(totalSaldo),
      batch_pending_count:      pendingCount,
      last_updated:             new Date().toISOString(),
    }
  };
}

// ─────────────────────────────────────────────────────────────
// WARGA DETAIL (for public warga page)
// ─────────────────────────────────────────────────────────────

function getWargaDetail(data) {
  var wargaId      = String(data.warga_id);
  var wargaRows    = sheetToObjects(getSheet(SHEETS.WARGA));
  var setoranRows  = sheetToObjects(getSheet(SHEETS.SETORAN));
  var distribRows  = sheetToObjects(getSheet(SHEETS.DISTRIBUSI));
  var saldoRows    = sheetToObjects(getSheet(SHEETS.SALDO));
  
  var warga = wargaRows.find(function(w) { return String(w.id) === wargaId; });
  if (!warga) return { status: 'error', message: 'Warga tidak ditemukan' };
  
  var mySetoran  = setoranRows.filter(function(s) { return String(s.warga_id) === wargaId; });
  var myDistrib  = distribRows.filter(function(d) { return String(d.warga_id) === wargaId; });
  var mySaldo    = saldoRows.find(function(s)   { return String(s.warga_id) === wargaId; });
  
  var totalKg = mySetoran.reduce(function(s, r) { return s + (parseFloat(r.berat_kg) || 0); }, 0);
  
  return {
    status: 'success',
    data: {
      warga: warga,
      saldo: mySaldo ? parseFloat(mySaldo.total_saldo) || 0 : 0,
      total_setoran_kg: Math.round(totalKg * 100) / 100,
      riwayat_setoran:  mySetoran,
      riwayat_distribusi: myDistrib.map(function(d) {
        d.berat      = parseFloat(d.berat) || 0;
        d.persentase = parseFloat(d.persentase) || 0;
        d.saldo      = parseFloat(d.saldo) || 0;
        return d;
      }),
    }
  };
}
