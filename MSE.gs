function doPost(e) {
  try {
    // Open your specific NeuroCalm Spreadsheet
    var sheetId = '1fmp7iZajEqncIIzWeWOTrPxzgqdT96GknhLyDamSmlA';
    var doc = SpreadsheetApp.openById(sheetId);
    
    // Parse the JSON data sent by the ESP32
    var data = JSON.parse(e.postData.contents);
    var sheetName = data.sheet; // The ESP32 will tell us which sheet to use
    var sheet = doc.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput("Error: Sheet tab not found");
    }

    // Format Timestamp
    var timestamp = new Date();
    var rowData = [timestamp];

    // Route the data to the correct columns based on the target sheet
    if (sheetName === "Sheet_MAX30102") {
      rowData.push(data.bpm, data.spo2, data.ir, data.red);
    } 
    else if (sheetName === "Sheet_DS18B20") {
      rowData.push(data.temperature);
    } 
    else if (sheetName === "Sheet_MPU6050") {
      rowData.push(data.accX, data.accY, data.accZ, data.gyroX, data.gyroY, data.gyroZ);
    } 
    else if (sheetName === "Sheet_AD8232") {
      rowData.push(data.ecg, data.ecg_bpm, data.hrv);
    }

    // Append the row to the sheet
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput("Success");
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString());
  }
}