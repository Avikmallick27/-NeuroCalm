#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"

#include <OneWire.h>
#include <DallasTemperature.h>

#include "MPU6050_tockn.h"

#include <U8g2lib.h>

// Wi-Fi & GOOGLE SHEETS SETUP
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Avikmallick27";          // <-- Put your Wi-Fi name here
const char* password = "Avikmallick27";  // <-- Put your Wi-Fi password here
const String GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxwT9e3YZrS5edOHOC5mzscHdoVowIrmHhqRfyCFmy5fZwB3yMmjV0kBxuB4Fp1X8kH7Q/exec"; 

// Pins
#define ONE_WIRE_BUS 4
#define ECG_PIN      36
#define LO_PLUS      5
#define LO_MINUS     18

MAX30105 particleSensor; 
MPU6050 mpu6050(Wire);

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

U8G2_SSD1306_128X64_NONAME_F_HW_I2C
u8g2(U8G2_R0, U8X8_PIN_NONE);

// Instantaneous Variables
float bodyTemp = 0;
long irValue = 0;
long redValue = 0;
float bpm = 0;
float spo2 = 0;
float accX, accY, accZ;
float gyroX, gyroY, gyroZ;
int ecgValue = 0;
float ecgBPM = 0;
float hrv = 0;

// --- BULK ACCUMULATION VARIABLES (1-Minute Windows) ---
unsigned long lastTransmissionTime = 0;
const unsigned long TRANSMISSION_INTERVAL = 60000; // 60,000 ms = 1 minute

// Cumulative sums to compute the average at the end of the minute
double sumBpm = 0, sumSpo2 = 0, sumTemp = 0, sumEcgBpm = 0, sumHrv = 0;
long sampleCount = 0;

// Variables to hold the final processed bulk data for the OLED display
float dispBpm = 0, dispSpo2 = 0, dispTemp = 0, dispEcgBpm = 0, dispHrv = 0;
bool hasFirstMinutePassed = false; 

// Timing variables for screen and local diagnostics
unsigned long lastDisplay = 0;
unsigned long lastSerialDiagnostics = 0;

// Extra internal variables required for calculations
#define BUFFER_SIZE 100
uint32_t irBuffer[BUFFER_SIZE]; 
uint32_t redBuffer[BUFFER_SIZE]; 
int bufferIndex = 0;

float ecgSignalAverage = 1800.0; 
unsigned long lastEcgBeat = 0;
unsigned long previousRrInterval = 0;
bool peakDetected = false;

// Network data push function
void sendSensorData(String params) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS); 
    
    String url = GOOGLE_SCRIPT_URL + "?" + params;
    http.begin(url);
    
    int httpCode = http.GET();
    if (httpCode <= 0) {
      Serial.print("Cloud send error: ");
      Serial.println(http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("Warning: Not connected with Wi-Fi. Skipping cloud upload.");
  }
}

void setup()
{
  Serial.begin(115200);
  Wire.begin(21, 22);

  pinMode(LO_PLUS, INPUT);
  pinMode(LO_MINUS, INPUT);

  u8g2.begin();

  ds18b20.begin();
  ds18b20.setWaitForConversion(false); 

  mpu6050.begin();
  mpu6050.calcGyroOffsets(true);

  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD))
  {
    Serial.println("MAX30102 NOT FOUND");
    while (1);
  }

  byte ledBrightness = 60; 
  byte sampleAverage = 4;   
  byte ledMode = 2;        
  byte sampleRate = 100;   
  int pulseWidth = 411;    
  int adcRange = 4096;     
  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);

  // Initialize Wi-Fi connection
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi...");
  
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nSuccessfully connected with Wi-Fi!");
  } else {
    Serial.println("\nNot connected with Wi-Fi. Operating in offline/local mode.");
  }

  Serial.println("System Ready");
  lastTransmissionTime = millis();
}

void loop()
{
  // ---------- MAX30102 ----------
  irValue = particleSensor.getIR();
  redValue = particleSensor.getRed();

  if (irValue > 50000) 
  {
    irBuffer[bufferIndex] = irValue;
    redBuffer[bufferIndex] = redValue;
    bufferIndex++;

    if (bufferIndex >= BUFFER_SIZE) 
    {
      int32_t spo2_calculated;
      int8_t validSpO2;
      int32_t heartRate_calculated;
      int8_t validHeartRate;

      maxim_heart_rate_and_oxygen_saturation(irBuffer, BUFFER_SIZE, redBuffer, &spo2_calculated, &validSpO2, &heartRate_calculated, &validHeartRate);
      
      if (validHeartRate == 1 && heartRate_calculated > 40 && heartRate_calculated < 180) {
        bpm = heartRate_calculated;
      }
      if (validSpO2 == 1 && spo2_calculated > 70 && spo2_calculated <= 100) {
        spo2 = spo2_calculated;
      }
      bufferIndex = 0; 
    }
  } 
  else 
  {
    bpm = 0;
    spo2 = 0;
    bufferIndex = 0;
  }

  // ---------- DS18B20 ----------
  static unsigned long lastTempRead = 0;
  if (millis() - lastTempRead > 2000) {
    bodyTemp = ds18b20.getTempCByIndex(0);
    ds18b20.requestTemperatures(); 
    lastTempRead = millis();
  }

  // ---------- MPU6050 ----------
  mpu6050.update();
  accX = mpu6050.getAccX();
  accY = mpu6050.getAccY();
  accZ = mpu6050.getAccZ();
  gyroX = mpu6050.getGyroX();
  gyroY = mpu6050.getGyroY();
  gyroZ = mpu6050.getGyroZ();

  // ---------- ECG ----------
  if (!(digitalRead(LO_PLUS) || digitalRead(LO_MINUS)))
  {
    ecgValue = analogRead(ECG_PIN);
    ecgSignalAverage = (ecgSignalAverage * 0.995) + (ecgValue * 0.005);
    int ecgDynamicThreshold = ecgSignalAverage + 350; 

    if (ecgValue > ecgDynamicThreshold && !peakDetected) 
    {
      peakDetected = true;
      unsigned long currentEcgBeat = millis();
      unsigned long rrInterval = currentEcgBeat - lastEcgBeat;

      if (rrInterval > 350 && rrInterval < 1500) 
      {
        ecgBPM = 60000.0 / rrInterval;
        if (previousRrInterval > 0) {
          hrv = abs((long)rrInterval - (long)previousRrInterval);
        }
        previousRrInterval = rrInterval;
      }
      lastEcgBeat = currentEcgBeat;
    }

    if (ecgValue < (ecgDynamicThreshold - 150)) {
      peakDetected = false;
    }
  }
  else 
  {
    ecgValue = 0;
    ecgBPM = 0;
    hrv = 0;
  }

  // --- LOCAL ACCUMULATION REGISTRY ---
  // Periodically gather active sensor metrics for the batch process
  static unsigned long lastDataSample = 0;
  if (millis() - lastDataSample > 100) { // Samples snapshots every 100ms
    if (bpm > 0)     sumBpm += bpm;
    if (spo2 > 0)    sumSpo2 += spo2;
    if (bodyTemp > 0) sumTemp += bodyTemp;
    if (ecgBPM > 0)  sumEcgBpm += ecgBPM;
    if (hrv > 0)     sumHrv += hrv;
    
    sampleCount++;
    lastDataSample = millis();
  }

  // ---------- 1 MINUTE DATA BULK PACKAGING & TRANSMISSION ----------
  if (millis() - lastTransmissionTime >= TRANSMISSION_INTERVAL)
  {
    // Compute the aggregate bulk averages for this past minute
    if (sampleCount > 0) {
      dispBpm    = sumBpm / (sumBpm > 0 ? (sumBpm/bpm) : 1); // safe averaging ignoring 0s
      dispBpm    = (sumBpm > 0) ? (sumBpm / (sampleCount)) : 0; // standard fallback
      
      // Better mathematical filter for active tracking windows:
      dispBpm    = (sumBpm > 0) ? (sumBpm / sampleCount) : 0;
      dispSpo2   = (sumSpo2 > 0) ? (sumSpo2 / sampleCount) : 0;
      dispTemp   = (sumTemp > 0) ? (sumTemp / sampleCount) : 0;
      dispEcgBpm = (sumEcgBpm > 0) ? (sumEcgBpm / sampleCount) : 0;
      dispHrv    = (sumHrv > 0) ? (sumHrv / sampleCount) : 0;
    }

    hasFirstMinutePassed = true;

    Serial.println("\n*** 1 Minute Interval Reached! Sending Bulk Package Data ***");

    // Send the bulk consolidated data matrices over Cloud integration
    sendSensorData("sensor=Sheet_MAX30102&bpm=" + String(dispBpm) + "&spo2=" + String(dispSpo2) + "&ir=" + String(irValue) + "&red=" + String(redValue));
    sendSensorData("sensor=Sheet_DS18B20&temp=" + String(dispTemp));
    sendSensorData("sensor=Sheet_MPU6050&ax=" + String(accX) + "&ay=" + String(accY) + "&az=" + String(accZ) + "&gx=" + String(gyroX) + "&gy=" + String(gyroY) + "&gz=" + String(gyroZ));
    sendSensorData("sensor=Sheet_AD8232&ecg=" + String(ecgValue) + "&ecgBpm=" + String(dispEcgBpm) + "&hrv=" + String(dispHrv));

    // Reset Bulk Variables for the next cycle
    sumBpm = 0; sumSpo2 = 0; sumTemp = 0; sumEcgBpm = 0; sumHrv = 0;
    sampleCount = 0;
    lastTransmissionTime = millis();
  }

  // ---------- OLED DISPLAY ----------
  if (millis() - lastDisplay > 250) {
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_6x10_tf);

    if (!hasFirstMinutePassed) {
      // Message seen during the very first 60 seconds of starting up
      u8g2.setCursor(0, 20);
      u8g2.print("Collecting Data...");
      u8g2.setCursor(0, 40);
      u8g2.print("Time Left: ");
      u8g2.print((TRANSMISSION_INTERVAL - (millis() - lastTransmissionTime)) / 1000);
      u8g2.print("s");
    } 
    else {
      // Displays the persistent, stable averages calculated from the last complete minute
      u8g2.setCursor(0, 10);
      u8g2.print("LAST MINUTE DATA:");
      
      u8g2.setCursor(0, 24);
      u8g2.print("BPM  : "); u8g2.print(dispBpm, 1);

      u8g2.setCursor(0, 36);
      u8g2.print("SpO2 : "); u8g2.print(dispSpo2, 1); u8g2.print("%");

      u8g2.setCursor(0, 48);
      u8g2.print("Temp : "); u8g2.print(dispTemp, 1); u8g2.print("C");

      u8g2.setCursor(0, 60);
      u8g2.print("eBPM : "); u8g2.print(dispEcgBpm, 1);
    }

    u8g2.sendBuffer();
    lastDisplay = millis();
  }

  // ---------- Debug Diagnostics Serial Output ----------
  if (millis() - lastSerialDiagnostics > 5000)
  {
    Serial.print("."); // Heartbeat ticker in between transmission cycles
    lastSerialDiagnostics = millis();
  }

  // ---------- Serial Plotter ----------
  static unsigned long lastPlot = 0;
  if (millis() - lastPlot > 10) {
    Serial.println(ecgValue);
    lastPlot = millis();
  }
}