
/**
 * CMDA-UCTH Yearly Planner - Google Apps Script Backend
 * "The Brain" - Handles Database Persistence, User Context, and Email Reports.
 */

/**
 * Serves the web application.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('CMDA-UCTH Yearly Planner')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Fetches all activities from the linked Google Sheet.
 * Automatically handles JSON parsing for complex fields.
 */
function getActivities() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        // Handle serialized JSON fields for recurrence and skipped dates
        if ((h === 'recurrence' || h === 'skippedDates') && val && typeof val === 'string' && val.trim() !== '') {
          try { 
            obj[h] = JSON.parse(val); 
          } catch(e) { 
            obj[h] = h === 'skippedDates' ? [] : null; 
          }
        } else if (h === 'isLocked') {
          obj[h] = val === true || val === 'true';
        } else {
          obj[h] = val;
        }
      });
      return obj;
    });
  } catch (error) {
    console.error("Error in getActivities:", error);
    return [];
  }
}

/**
 * Saves or updates an activity in the Google Sheet.
 */
function saveActivity(activity) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Prepare activity for storage (serialize complex objects to JSON strings)
    const storageActivity = { ...activity };
    if (storageActivity.recurrence && typeof storageActivity.recurrence !== 'string') {
      storageActivity.recurrence = JSON.stringify(storageActivity.recurrence);
    }
    if (storageActivity.skippedDates && typeof storageActivity.skippedDates !== 'string') {
      storageActivity.skippedDates = JSON.stringify(storageActivity.skippedDates);
    }
    
    const idIndex = headers.indexOf('id');
    const rowIndex = data.findIndex(row => row[idIndex] === activity.id);
    
    const rowValues = headers.map(h => storageActivity[h] !== undefined ? storageActivity[h] : '');
    
    if (rowIndex > -1) {
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    return activity;
  } catch (error) {
    console.error("Error in saveActivity:", error);
    throw new Error("Failed to save activity to spreadsheet.");
  }
}

/**
 * Deletes an activity from the Google Sheet.
 */
function deleteActivity(id) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf('id');
    const rowIndex = data.findIndex(row => row[idIndex] === id);
    
    if (rowIndex > -1) {
      sheet.deleteRow(rowIndex + 1);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error in deleteActivity:", error);
    throw new Error("Failed to delete activity from spreadsheet.");
  }
}

/**
 * Sends a generated report to the active user's email.
 */
function sendReportEmail(reportText) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const subject = "CMDA-UCTH Monthly Activity Report";
    const body = "Please find the requested activity report below:\n\n" + 
                 "--------------------------------------------------\n\n" + 
                 reportText + 
                 "\n\n--------------------------------------------------\n" +
                 "Sent via CMDA-UCTH Yearly Planner App.";
    
    MailApp.sendEmail({
      to: userEmail,
      subject: subject,
      body: body
    });
    return true;
  } catch (error) {
    console.error("Error in sendReportEmail:", error);
    throw new Error("Failed to send email. Ensure you have granted the necessary permissions.");
  }
}

/**
 * Gets the current user's email.
 */
function getUserInfo() {
  return {
    email: Session.getActiveUser().getEmail()
  };
}

/**
 * Internal helper to ensure the database sheet exists and is formatted correctly.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Activities');
  if (!sheet) {
    sheet = ss.insertSheet('Activities');
    // Define headers matching the Activity interface
    sheet.appendRow(['id', 'startDate', 'endDate', 'activityName', 'board', 'status', 'isLocked', 'recurrence', 'skippedDates', 'parentId']);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
