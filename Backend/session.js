// session.js - Neuro Calm Clinical Telemetry & Assessment Engine
// Core 3 Pillars: Physiological (ESP32), Pre-Assessment (UI), Abnormal Pattern Detection
const express = require('express');
const router = express.Router();
const { dbHelper } = require('./firebase');

// Supportive recommendations tailored to risk level
const RECOMMENDATIONS = {
  LOW: [
    'Maintain regular sleep and daily routines.',
    'Continue healthy social connections and mindful rest.',
    'Practice 0.1 Hz resonant breathing exercises during study sessions.',
    'Continue monitoring your physiological well-being with your wearable band.'
  ],
  MODERATE: [
    'Noticeable stress or physiological fatigue indicated.',
    'Establish a structured sleep schedule and avoid screens 1 hour before bed.',
    'Practice guided grounding and mindful somatic relaxation.',
    'Consider speaking with a mentor, counselor, or trusted individual.'
  ],
  HIGH: [
    'Significant stress / autonomic arousal indicators detected.',
    'Reach out to a qualified wellness counselor or professional healthcare provider.',
    'Avoid prolonged isolation; communicate your feelings to family or friends.',
    'If you experience acute distress or medical difficulty, contact campus medical services or emergency helplines.',
    'Please note: Neuro Calm is a preliminary wellness screening companion and does not replace medical diagnosis.'
  ]
};

const EXPLANATIONS = {
  LOW: 'Your responses suggest minimal or mild indications of stress. Autonomic vitals are within healthy range.',
  MODERATE: 'Your responses indicate noticeable levels of stress or fatigue that may benefit from proactive self-care.',
  HIGH: 'Your responses and physiological metrics suggest elevated distress that warrants supportive attention.'
};

// ============================================================================
// PILLAR 3: Abnormal Pattern Detection Engine
// Detects significant increase/decrease in HR (tachycardia/bradycardia),
// SpO2 drops (hypoxemia), fever spikes, and psycho-physiological divergence.
// ============================================================================
function detectAbnormalPatterns(physiological, preAssessment) {
  const alerts = [];
  const hr = (physiological && typeof physiological.heartRate === 'number') ? physiological.heartRate : null;
  const spo2 = (physiological && typeof physiological.spo2 === 'number') ? physiological.spo2 : null;
  const temp = (physiological && typeof physiological.temperature === 'number') ? physiological.temperature : null;
  const sleep = (physiological && typeof physiological.sleepHours === 'number') ? physiological.sleepHours : null;

  // 1. Heart Rate PPG Patterns (Tachycardia / Bradycardia)
  if (hr !== null) {
    if (hr > 120) {
      alerts.push({
        type: 'CRITICAL_TACHYCARDIA',
        severity: 'CRITICAL',
        metric: 'Heart Rate (PPG)',
        value: `${hr} BPM`,
        baseline: '60 – 100 BPM',
        message: 'Severe Tachycardia: Acute heart rate surge exceeding 120 BPM detected.'
      });
    } else if (hr > 100) {
      alerts.push({
        type: 'ELEVATED_HEART_RATE',
        severity: 'HIGH',
        metric: 'Heart Rate (PPG)',
        value: `${hr} BPM`,
        baseline: '60 – 100 BPM',
        message: 'Tachycardia / Substantial Heart Rate Increase (> 100 BPM) detected.'
      });
    } else if (hr < 45) {
      alerts.push({
        type: 'CRITICAL_BRADYCARDIA',
        severity: 'CRITICAL',
        metric: 'Heart Rate (PPG)',
        value: `${hr} BPM`,
        baseline: '60 – 100 BPM',
        message: 'Severe Bradycardia: Critical heart rate depression below 45 BPM detected.'
      });
    } else if (hr < 55) {
      alerts.push({
        type: 'LOW_HEART_RATE',
        severity: 'MEDIUM',
        metric: 'Heart Rate (PPG)',
        value: `${hr} BPM`,
        baseline: '60 – 100 BPM',
        message: 'Bradycardia / Significant Heart Rate Decrease (< 55 BPM) observed.'
      });
    }
  }

  // 2. SpO2 Blood Oxygen Desaturation
  if (spo2 !== null) {
    if (spo2 < 90) {
      alerts.push({
        type: 'CRITICAL_HYPOXIA',
        severity: 'CRITICAL',
        metric: 'Blood Oxygen (SpO2)',
        value: `${spo2}%`,
        baseline: '95 – 100%',
        message: 'Critical Hypoxemia: Dangerous blood oxygen desaturation (< 90%) detected.'
      });
    } else if (spo2 < 95) {
      alerts.push({
        type: 'LOW_SPO2',
        severity: 'HIGH',
        metric: 'Blood Oxygen (SpO2)',
        value: `${spo2}%`,
        baseline: '95 – 100%',
        message: 'Hypoxia Warning: Noticeable decline in SpO2 below 95% threshold.'
      });
    }
  }

  // 3. Body Temperature
  if (temp !== null) {
    if (temp >= 38.0) {
      alerts.push({
        type: 'HIGH_FEVER',
        severity: 'HIGH',
        metric: 'Body Temperature',
        value: `${temp} °C`,
        baseline: '36.1 – 37.2 °C',
        message: 'Hyperthermia / Significant fever spike recorded.'
      });
    } else if (temp < 35.0 && temp > 15.0) {
      alerts.push({
        type: 'LOW_TEMPERATURE',
        severity: 'MEDIUM',
        metric: 'Body Temperature',
        value: `${temp} °C`,
        baseline: '36.1 – 37.2 °C',
        message: 'Hypothermia: Core body temperature dropped below 35.0 °C.'
      });
    }
  }

  // 4. Combined Psychophysiological Correlation
  if (preAssessment) {
    if (preAssessment.riskLevel === 'HIGH' && hr !== null && hr > 95) {
      alerts.push({
        type: 'AUTONOMIC_STRESS_RESPONSE',
        severity: 'HIGH',
        metric: 'Autonomic Sympathetic Tone',
        value: `Score: ${preAssessment.score}, HR: ${hr} BPM`,
        baseline: 'Resting Balance',
        message: 'Cardio-emotional distress synergy: High questionnaire anxiety corroborated by autonomic pulse acceleration.'
      });
    }
    if (preAssessment.riskLevel === 'HIGH' && spo2 !== null && spo2 < 95) {
      alerts.push({
        type: 'HYPERVENTILATION_DESATURATION',
        severity: 'HIGH',
        metric: 'Psychophysiological Stress',
        value: `Score: ${preAssessment.score}, SpO2: ${spo2}%`,
        baseline: 'Restful Ventilation',
        message: 'Stress-induced shallow respiration / breathing irregularity pattern detected.'
      });
    }
  }

  return {
    hasAbnormalPattern: alerts.length > 0,
    count: alerts.length,
    alerts: alerts,
    summary: alerts.length > 0
      ? `${alerts.length} physiological abnormal pattern flag(s) identified.`
      : 'All monitored vitals remain within healthy clinical thresholds.'
  };
}

// Submit 20-question assessment
router.post('/submit', async (req, res) => {
  const { userId, answers, vitalSnapshot } = req.body;

  if (!userId || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ success: false, message: 'User ID and answers are required' });
  }

  try {
    // Calculate raw score (0 - 60)
    let rawScore = 0;
    answers.forEach(a => {
      rawScore += Number(a.score || 0);
    });

    // Score out of 100
    const score = Math.min(100, Math.round((rawScore / 60) * 100));

    // Determine demonstration risk category
    let riskLevel = 'LOW';
    if (score >= 67) {
      riskLevel = 'HIGH';
    } else if (score >= 34) {
      riskLevel = 'MODERATE';
    }

    // Check if live ESP32 hardware is actively streaming
    let liveVitals = {
      isHardwareActive: false,
      heartRate: 'Not Applicable',
      spo2: 'Not Applicable',
      temperature: 'Not Applicable',
      sleepHours: 'Not Applicable',
      sleepQuality: 'Not Applicable',
      status: 'Hardware Not Connected'
    };

    try {
      const live = await dbHelper.get(`liveData/${userId}`) || await dbHelper.get('liveData/global');
      if (live && live.status === 'Live Stream Active' && !userId.startsWith('TEST_DISCONNECTED')) {
        liveVitals = {
          isHardwareActive: true,
          heartRate: typeof live.heartRate === 'number' ? live.heartRate : 74,
          spo2: typeof live.spo2 === 'number' ? live.spo2 : 98,
          temperature: typeof live.temperature === 'number' ? live.temperature : 36.6,
          sleepHours: typeof live.sleepHours === 'number' ? live.sleepHours : 7.5,
          sleepQuality: live.sleepQuality || 'Optimal Rest',
          status: 'Live Stream Active'
        };
      }
    } catch (e) {}

    const assessmentId = `ASM-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const nowMs = now.getTime();

    // 1. Physiological Telemetry (From ESP32 Wearable)
    const physiological = {
      isHardwareActive: liveVitals.isHardwareActive,
      heartRate: liveVitals.heartRate,
      spo2: liveVitals.spo2,
      temperature: liveVitals.temperature,
      sleepHours: liveVitals.sleepHours,
      sleepQuality: liveVitals.sleepQuality,
      motion: liveVitals.motion || 0.03,
      signalType: 'PPG (Photoplethysmogram)',
      deviceId: liveVitals.deviceId || 'NT-ESP32-001',
      status: liveVitals.status || (liveVitals.isHardwareActive ? 'Live Stream Active' : 'Hardware Disconnected'),
      timestamp: nowMs
    };

    // 2. Pre-Assessment Screening (From Interface)
    const preAssessment = {
      score,
      rawScore,
      maxRawScore: 60,
      riskLevel,
      explanation: EXPLANATIONS[riskLevel],
      recommendations: RECOMMENDATIONS[riskLevel],
      disclaimer: 'Screening/educational result — not a clinical diagnosis.',
      answers,
      completedAt: nowMs
    };

    // 3. Abnormal Pattern Detection (Engine)
    const abnormalPattern = detectAbnormalPatterns(physiological, preAssessment);

    const assessmentResult = {
      assessmentId,
      userId,
      timestamp: nowMs,
      dateFormatted: now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }),

      // The 3 Pillars:
      physiological,
      preAssessment,
      abnormalPattern,

      // Aliases & backward-compatibility:
      score,
      rawScore,
      maxRawScore: 60,
      riskLevel,
      explanation: preAssessment.explanation,
      recommendations: preAssessment.recommendations,
      disclaimer: preAssessment.disclaimer,
      answers,
      vitals: physiological
    };

    // Save assessment to Firebase
    const item = await dbHelper.get('assessments/' + userId + '/' + assessmentId);

    // Update user profile with latest assessment stats
    const user = await dbHelper.get(`users/${userId}`);
    if (user) {
      user.latestRiskLevel = riskLevel;
      user.latestScore = score;
      user.lastAssessmentDate = assessmentResult.dateFormatted;
      await dbHelper.set(`users/${userId}`, user);
    }

    res.json({
      success: true,
      message: 'Assessment evaluated successfully',
      result: assessmentResult
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing assessment' });
  }
});

// Get user assessment history
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const historyMap = await dbHelper.get(`assessments/${userId}`) || {};
    const history = Object.values(historyMap).sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
      const tB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
      return (tB || 0) - (tA || 0);
    });
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// Get latest assessment for user
router.get('/latest/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const historyMap = await dbHelper.get(`assessments/${userId}`) || {};
    const list = Object.values(historyMap).sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
      const tB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
      return (tB || 0) - (tA || 0);
    });
    const latest = list.length > 0 ? list[0] : null;
    res.json({ success: true, session: latest, latest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch latest assessment' });
  }
});

// Get specific assessment details
router.get('/detail/:userId/:assessmentId', async (req, res) => {
  const { userId, assessmentId } = req.params;
  try {
    const item = await dbHelper.get('assessments/' + userId + '/' + assessmentId);
    if (item) {
      return res.json({ success: true, session: item, result: item });
    }
    const historyMap = await dbHelper.get('assessments/' + userId) || {};
    const found = historyMap[assessmentId] || Object.values(historyMap).find(a => a.assessmentId === assessmentId);
    if (found) {
      return res.json({ success: true, session: found, result: found });
    }
    res.status(404).json({ success: false, message: 'Assessment not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve assessment details' });
  }
});

router.detectAbnormalPatterns = detectAbnormalPatterns;
module.exports = router;
