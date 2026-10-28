<div align="center">
  <img src="Frontend/assets/logo.png" alt="Neuro Calm Logo" width="160" style="border-radius: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
  <h1>Neuro Calm</h1>
  <p><strong>MIND TODAY. BRIGHTER TOMORROWS.</strong></p>
  <p><em>Student Health & Biometric Telemetry System (SIH 26094)</em></p>
  <p><small>(Also aliased as Neuro Clam in competition registry)</small></p>
</div>

---

**Neuro Calm** is a smart digital health & physiological telemetry platform engineered for secondary school, college, and university students. It combines **standardized self-assessment psychological screening** with **continuous wearable biometric telemetry** (Photoplethysmogram PPG Pulse Rate, Blood Oxygen SpO₂, Core Body Temperature, and Accelerometer Sleep/Rest Analysis) alongside an **intelligent abnormal pattern detection engine**.

> **Note:** The platform works **100% out of the box with or without hardware**. If no wearable band is connected, the website safely displays `"Not Applicable"` with a calm flatline baseline — no crashes, errors, or timeouts.

---

## 🏛️ The Three Core Pillars Architecture

Neuro Calm is organized around three medical & telemetry pillars:

```text
Neuro Calm/
├── 1. 🩺 Physiological (From ESP32 Wearable)
│   ├── Optical Photoplethysmogram (PPG) Pulse Rate (MAX30102)
│   ├── Blood Oxygen Saturation SpO2 (%)
│   ├── Core Body Temperature (°C via DS18B20)
│   └── Rest & Motion Quality (MPU6050 6-Axis Accelerometer)
│
├── 2. 📋 Pre-Assessment (From Web Interface)
│   ├── Standardized 10/20-Question Well-Being Questionnaire
│   ├── Dynamic Scoring Algorithm (0–100 Scale)
│   ├── Risk Stratification (LOW, MODERATE, HIGH RISK)
│   └── Actionable Supportive Guidance & Recommendations
│
└── 3. ⚠️ Abnormal Pattern Detection Engine
    ├── Tachycardia Alert: Heart Rate > 100 BPM (Critical > 120 BPM)
    ├── Bradycardia Alert: Heart Rate < 55 BPM (Critical < 45 BPM)
    ├── Hypoxemia Alert: SpO2 < 95% (Critical Emergency < 90%)
    ├── Hyperthermia Alert: Body Temperature ≥ 37.8 °C (Fever)
    └── Psychophysiological Divergence: Autonomic pulse spike coinciding with high distress
```

---

## 📈 Photoplethysmogram (PPG) vs ECG Waveforms

A vital design improvement in Neuro Calm is that all cardiovascular graphs strictly represent **PPG (Photoplethysmogram)** signals, **NOT ECG**:

| Feature | Photoplethysmogram (PPG) — Used in Neuro Calm | Electrocardiogram (ECG) |
|:---|:---|:---|
| **Sensor** | **MAX30102 Optical Sensor** (Infrared & Red Light LED) | Chest / Limb Surface Electrodes (Ag/AgCl) |
| **Measurement** | **Arterial volumetric pulse wave** via light absorption | Electrical depolarization of cardiac tissue |
| **Waveform Shape** | Smooth pulsatile wave with **Systolic Crest** and **Dicrotic Notch** | Sharp **P-Q-R-S-T** voltage spikes |
| **Comfort** | **Non-invasive wearable wrist/finger band** (zero skin irritation) | Bulky wires, electrode gels, and conductive pads |
| **Hackathon Target** | Continuous, comfortable student health monitoring | Clinical diagnostic cardiac evaluation |

On the **Data / Live** page (`Frontend/data-live.html`), Neuro Calm features a **real-time optical PPG oscilloscope visualizer** that sweeps the authentic arterial pulse curve synchronized dynamically with the user's live BPM.

---

## 📄 Download Data PDF

Neuro Calm includes a built-in, client-side PDF export engine (`Frontend/pdfExport.js`) that produces a clinical-grade medical/wellness report:

- **Where to Download:**
  1. **Assessment Result Page (`session-result.html`):** Click **"Download Data PDF"** to save your screening report.
  2. **Data / Live Page (`data-live.html`):** Click **"Download Data PDF"** to snapshot live telemetry and active abnormal alerts.
  3. **History Page (`history.html`):** Download individual past reports or click **"Download History PDF"**.
  4. **Counselor Console (`authority-user-detail.html`):** Export complete student health dossiers for medical review.
- **Report Contents:**
  - Student Profile (Name, UID, Age, Gender, Date/Time)
  - Pillar 1: Physiological Telemetry Table (PPG Pulse, SpO2, Temperature, Sleep)
  - Pillar 2: Pre-Assessment Risk Level, Score, and Questionnaire Answers
  - Pillar 3: Active Abnormal Pattern Flags and Thresholds
  - Counselor Directives and Medical Disclaimer

---

## ⚙️ Easy Firebase Database Configuration

You can easily replace the Firebase Realtime Database with your own Firebase project in a single file:

### Configuration File: `Backend/firebaseConfig.js`

```javascript
// Central Firebase Configuration for Neuro Calm
const FIREBASE_DB_ID = process.env.FIREBASE_DB_ID || "neuro-tech-01-default-rtdb";

// URL is constructed automatically: https://<id>.firebaseio.com
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || `https://${FIREBASE_DB_ID}.firebaseio.com`;
```

- **If your link is:** `https://neuro-tech-01-default-rtdb.firebaseio.com`
- **Then simply set:** `id = "neuro-tech-01-default-rtdb"`
- Both backend and frontend automatically sync with the configured URL!
- In ESP32 hardware (`Hardware/NeuroCalm_ESP32_Wearable/NeuroCalm_ESP32_Wearable.ino`), update `const char* firebaseDbId = "neuro-tech-01-default-rtdb";`.

---

## 🚀 Quick Start Guide (Run from Scratch)

Follow these simple steps to start the Neuro Calm application:

### Step 1: Prerequisites
Ensure you have **Node.js** (v16+) installed on your system:
```bash
node -v
npm -v
```

---

### Step 2: Open the Backend Directory
Open your terminal (PowerShell, Command Prompt, or VS Code terminal) and navigate into the `Backend` directory:
```bash
cd "Backend"
```

---

### Step 3: Install Dependencies
Run npm install (takes ~15 seconds on initial setup):
```bash
npm install
```

---

### Step 4: Start the Server
Start the development server with auto-reload:
```bash
npm run dev
```
*(Or start standard production server: `npm start`)*

You will see:
```text
Server running on http://localhost:5000
Database: Local Persistent Storage active (local_db.json)
```

---

### Step 5: Open the Web Portal
Open your web browser (Chrome, Edge, Brave, or Firefox) and visit:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Default Login Credentials

### 👤 Student / User Login
- **User ID:** `NT1001`
- **PIN:** `1234`
- *Access: Personal dashboard, 3-pillar wellness reports, real-time optical PPG stream, PDF downloads.*

### 🛡️ Authority / Counselor / Doctor Login
- **Email:** `admin@neurocalm.com` *(also accepts `admin@neuroclam.com` or `admin@neurotrack.com`)*
- **Password:** `admin123`
- *Access: Student roster, triage high-risk/abnormal pattern alerts, issue new student credentials, export clinical patient PDF dossiers.*

---

## 📁 Project Directory Structure

```text
SIH 26094 (Neuro Calm)/
├── Backend/                               # Express.js REST API & Database Gateway
│   ├── firebaseConfig.js                  # Centralized, easy-to-replace Firebase configuration
│   ├── firebase.js                        # Database manager (Local fallback & Cloud sync)
│   ├── server.js                          # Main Express server (/api/config, /api/health)
│   ├── session.js                         # Pillar 2 Pre-Assessment & Pillar 3 Abnormal Pattern Engine
│   ├── wearable.js                        # Pillar 1 Physiological Ingestion & Live PPG Telemetry
│   ├── login.js                           # Dual-role authentication (Student & Authority)
│   ├── users.js                           # Counselor student roster management
│   ├── local_db.json                      # Persistent offline JSON database
│   ├── package.json                       # Dependencies & scripts
│   └── .env                               # Environment variables (FIREBASE_DB_ID)
│
├── Frontend/                              # Responsive Web Application
│   ├── index.html                         # Landing page with 3 pillars overview
│   ├── login.html                         # Student UID & PIN login
│   ├── dashboard.html                     # Student health overview
│   ├── data-live.html                     # Live Optical PPG Waveform & Abnormal Monitor
│   ├── session-intro.html                 # Assessment instructions
│   ├── session-question.html              # Screening questionnaire
│   ├── session-review.html                # Response review before scoring
│   ├── session-result.html                # 3-Pillars result & Download Data PDF button
│   ├── history.html                       # Past assessment archive & row PDF download
│   ├── statistics.html                    # Longitudinal charts & sleep analysis
│   ├── profile.html                       # Student profile management
│   ├── authority-users.html               # Authority student console
│   ├── authority-user-detail.html         # Clinical patient dossier & PDF export
│   ├── pdfExport.js                       # Comprehensive jsPDF clinical export engine
│   ├── firebase-config.js                 # Central frontend Firebase client configuration
│   ├── style.css                          # Modern clinical styling & PPG visualizer themes
│   └── assets/                            # Logos and medical graphics
│
├── Hardware/                              # Dedicated Arduino Firmware for ESP32
│   └── NeuroCalm_ESP32_Wearable/
│       └── NeuroCalm_ESP32_Wearable.ino   # Microcontroller sketch (MAX30102 PPG, DS18B20, MPU6050)
│
└── README.md                              # This project documentation
```

---

## ⌚ ESP32 Wearable Band Hardware Guide

### Pin Connections:
| Sensor / Peripheral | Sensor Pin | ESP32 GPIO Pin | Description |
|:---|:---|:---|:---|
| **All Modules** | VCC | **3V3** | 3.3V Power Bus |
| **All Modules** | GND | **GND** | Ground Rail |
| **MAX30102 (PPG)** | SDA | **GPIO 21** | I2C Data (Optical Pulse & SpO2) |
| **MAX30102 (PPG)** | SCL | **GPIO 22** | I2C Clock |
| **MPU6050** | SDA / SCL | **GPIO 21 / 22** | Shared I2C Bus for motion/rest |
| **SSD1306 OLED** | SDA / SCL | **GPIO 21 / 22** | Shared I2C Bus for status display |
| **DS18B20** | DATA | **GPIO 4** | OneWire bus (with 4.7kΩ pull-up resistor to 3V3) |

### Flashing with Arduino IDE:
1. Open [`Hardware/NeuroCalm_ESP32_Wearable/NeuroCalm_ESP32_Wearable.ino`](Hardware/NeuroCalm_ESP32_Wearable/NeuroCalm_ESP32_Wearable.ino) in the **Arduino IDE**.
2. Install required libraries:
   - `SparkFun MAX3010x Pulse and Proximity Sensor Library`
   - `DallasTemperature`
   - `OneWire`
   - `MPU6050_tockn`
   - `U8g2`
3. Enter your Wi-Fi credentials in lines 14–15:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
4. Verify your `firebaseDbId = "neuro-tech-01-default-rtdb"` on line 21.
5. Connect your ESP32 via USB and click **Upload**.

---

## 🔒 Security & Privacy Notice

- **Educational & Screening Tool:** Neuro Calm is intended as a non-invasive preliminary wellness monitor and self-care guide. It does not replace professional medical or psychiatric diagnosis.
- **Authority Supervised Access:** Students can log in using unique credentials issued by verified institutional authorities.

## 👥 Contributors

- **Anwesha Mondal** — [@AnweshaArc](https://github.com/AnweshaArc)
- **Suman Karmakar** — [@suman-karmakar-01](https://github.com/suman-karmakar-01)
- **Avik Mallick** — [@Avikmallick27](https://github.com/Avikmallick27)
- **Arkajit Roy** — [@arkajit-roy](https://github.com/arkajit-roy)
- **Monali De** — [@Mavisha1](https://github.com/Mavisha1)

*Neuro Calm — Smart India Hackathon (SIH 26094).*
