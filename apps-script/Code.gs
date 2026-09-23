/**
 * Student intake -> Google Sheet
 *
 * SETUP (one time, ~5 minutes):
 *  1. Create a new Google Sheet (sheet.new). This is where responses land.
 *  2. Extensions -> Apps Script. Delete the sample code, paste ALL of this file.
 *  3. Click Deploy -> New deployment -> gear icon -> "Web app".
 *       - Description: intake
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Deploy, authorize when prompted, and COPY the Web app URL (ends in /exec).
 *  4. Send that /exec URL to me — I paste it into the form and push it live.
 *
 * To change the questions later: edit FIELDS to match the form field names.
 */

var FIELDS = [
  'name', 'display_name', 'school', 'grade', 'city', 'oneliner', 'working_toward', 'resume_link',
  'about_who', 'about_proud', 'about_different', 'motto',
  'p1_title', 'p1_oneliner', 'p1_problem', 'p1_did', 'p1_tools', 'p1_result', 'p1_link',
  'p2_title', 'p2_oneliner', 'p2_problem', 'p2_did', 'p2_tools', 'p2_result', 'p2_link',
  'p3_title', 'p3_oneliner', 'p3_problem', 'p3_did', 'p3_tools', 'p3_result', 'p3_link',
  'skills_g1', 'skills_g2', 'skills_g3',
  'rec1', 'rec2', 'rec3', 'rec4',
  'hobby1', 'hobby2', 'hobby3',
  'c_email', 'c_linkedin', 'c_instagram', 'c_portfolio',
  'style_pref'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // avoid two submissions racing on the same row
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Responses') || ss.insertSheet('Responses');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['timestamp'].concat(FIELDS));
      sheet.setFrozenRows(1);
    }

    var params = (e && e.parameter) ? e.parameter : {};
    var row = [new Date()];
    for (var i = 0; i < FIELDS.length; i++) {
      row.push(params[FIELDS[i]] || '');
    }
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm it's live.
function doGet() {
  return ContentService
    .createTextOutput('Intake endpoint is live. Submit via the form.')
    .setMimeType(ContentService.MimeType.TEXT);
}
