/**
 * Cosy Nest – Leukerbad : API du site d'accueil.
 * Ce script est lié à une feuille Google Sheets. Il sert les séjours et les réglages
 * à la page voyageurs (GET) et enregistre les modifications de l'espace hôte (POST).
 *
 * Mot de passe de l'espace hôte : modifiez ADMIN_PASSWORD, puis
 * Déployer > Gérer les déploiements > crayon > Version : Nouvelle version > Déployer.
 */
var ADMIN_PASSWORD = 'Mondoudou7';

var SHEET_STAYS = 'sejours';
var SHEET_SETTINGS = 'reglages';
var STAY_HEADERS = ['prenoms', 'langue', 'arrivee', 'depart', 'etapes', 'contact'];
var SETTING_KEYS = ['wifiName', 'wifiPass', 'checkin', 'checkout', 'hostPhone', 'parkingSpot'];
var SHEET_VISITS = 'visites';
var VISIT_HEADERS = ['date', 'sejour', 'ville', 'region', 'pays', 'appareil', 'langue'];
var MAX_VISITS = 2000;

function doGet(e) {
  return json_(readState_());
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (body.action === 'visit') { logVisit_(body); return json_({ ok: true }); }
  if (String(body.password || '') !== ADMIN_PASSWORD) {
    Utilities.sleep(800); // ralentit les essais de mot de passe
    return json_({ ok: false, error: 'bad_password' });
  }
  if (body.action === 'login') return json_({ ok: true, state: readState_() });
  if (body.action === 'visits') return json_({ ok: true, visits: readVisits_() });
  if (body.action === 'save') { writeState_(body.state || {}); return json_({ ok: true, state: readState_() }); }
  return json_({ ok: false, error: 'bad_action' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}

function iso_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Europe/Zurich', 'yyyy-MM-dd');
  return String(v || '').trim().slice(0, 10);
}

function readState_() {
  var st = sheet_(SHEET_STAYS, STAY_HEADERS);
  var rows = st.getDataRange().getValues().slice(1);
  var stays = [];
  rows.forEach(function (r) {
    var names = String(r[0] || '').split(/\s*[,;]\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (!names.length && !r[2]) return;
    stays.push({ names: names, lang: String(r[1] || 'auto').trim() || 'auto', from: iso_(r[2]), to: iso_(r[3]), steps: steps_(r[4]), contact: contact_(r[5], names) });
  });
  var se = sheet_(SHEET_SETTINGS, ['cle', 'valeur']);
  var settings = {};
  SETTING_KEYS.forEach(function (k) { settings[k] = ''; });
  se.getDataRange().getValues().slice(1).forEach(function (r) {
    if (r[0]) settings[String(r[0]).trim()] = String(r[1] == null ? '' : r[1]).trim();
  });
  return { stays: stays, settings: settings };
}

function writeState_(state) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var st = sheet_(SHEET_STAYS, STAY_HEADERS);
    st.clearContents();
    var rows = [STAY_HEADERS];
    (state.stays || []).forEach(function (s) {
      var names = Array.isArray(s.names) ? s.names : String(s.name || '').split(',');
      names = names.map(function (x) { return String(x).trim(); }).filter(Boolean);
      if (!names.length && !s.from) return;
      rows.push([names.join(', '), String(s.lang || 'auto'), "'" + iso_(s.from), "'" + iso_(s.to), "'" + steps_(s.steps).join(','), contact_(s.contact, names)]);
    });
    st.getRange(1, 1, rows.length, STAY_HEADERS.length).setValues(rows);
    st.setFrozenRows(1);

    var se = sheet_(SHEET_SETTINGS, ['cle', 'valeur']);
    se.clearContents();
    var srows = [['cle', 'valeur']];
    var settings = state.settings || {};
    SETTING_KEYS.forEach(function (k) { srows.push([k, String(settings[k] == null ? '' : settings[k])]); });
    se.getRange(1, 1, srows.length, 2).setValues(srows);
    se.setFrozenRows(1);
  } finally {
    lock.releaseLock();
  }
}

function logVisit_(b) {
  var clip = function (x) { return String(x == null ? '' : x).slice(0, 80); };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_(SHEET_VISITS, VISIT_HEADERS);
    var now = Utilities.formatDate(new Date(), 'Europe/Zurich', 'yyyy-MM-dd HH:mm');
    sh.appendRow(["'" + now, clip(b.stay), clip(b.city), clip(b.region), clip(b.country), clip(b.device), clip(b.lang)]);
    var n = sh.getLastRow();
    if (n > MAX_VISITS + 1) sh.deleteRows(2, n - MAX_VISITS - 1);
  } finally {
    lock.releaseLock();
  }
}

function readVisits_() {
  var sh = sheet_(SHEET_VISITS, VISIT_HEADERS);
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  var k = Math.min(n, 300);
  var rows = sh.getRange(sh.getLastRow() - k + 1, 1, k, VISIT_HEADERS.length).getDisplayValues();
  return rows.reverse().map(function (r) {
    return { date: r[0], stay: r[1], city: r[2], region: r[3], country: r[4], device: r[5], lang: r[6] };
  });
}

// Étapes du suivi d'une réservation (1 à 6 ; l'étape 0 = réservation confirmée, toujours faite)
function steps_(v) {
  var list = Array.isArray(v) ? v : String(v == null ? '' : v).split(/\s*[,;]\s*/);
  var out = [];
  list.forEach(function (x) { var n = parseInt(x, 10); if (n >= 1 && n <= 6 && out.indexOf(n) < 0) out.push(n); });
  return out.sort();
}

// Prénom de contact choisi dans le suivi (doit faire partie des prénoms du séjour)
function contact_(v, names) {
  var c = String(v == null ? '' : v).trim();
  return names.indexOf(c) >= 0 ? c : '';
}
