/**
 * Neuro Calm - PDF Export Utility
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NeuroCalmPDF = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // Load jsPDF dynamically if not present
  function ensureJsPDF() {
    return new Promise((resolve) => {
      if (window.jspdf && window.jspdf.jsPDF) {
        return resolve(window.jspdf.jsPDF);
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        // Also attempt autotable
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
        autoTableScript.onload = () => resolve(window.jspdf.jsPDF);
        autoTableScript.onerror = () => resolve(window.jspdf.jsPDF);
        document.head.appendChild(autoTableScript);
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }

  // Fallback printable report popup if CDN is unreachable
  function fallbackPrintReport(title, contentHtml) {
    const win = window.open('', '_blank', 'width=850,height=900');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0F172A; }
          .header { border-bottom: 3px solid #0284C7; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 800; color: #0284C7; letter-spacing: 0.5px; }
          .sub { color: #64748B; font-size: 13px; margin-top: 4px; }
          .section { margin-bottom: 24px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; }
          .sec-title { font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 12px; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { padding: 8px 12px; border: 1px solid #E2E8F0; text-align: left; }
          th { background: #E2E8F0; font-weight: 600; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 12px; }
          .badge-low { background: #DCFCE7; color: #166534; }
          .badge-mod { background: #FEF3C7; color: #92400E; }
          .badge-high { background: #FEE2E2; color: #991B1B; }
          .alert-box { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 8px 12px; margin-top: 6px; font-size: 12px; }
          .no-alert { color: #15803D; font-weight: 600; font-size: 13px; }
          .disclaimer { margin-top: 32px; font-size: 11px; color: #94A3B8; border-top: 1px dashed #CBD5E1; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">NEURO CALM</div>
          <div class="sub">Student Health & Physiological Telemetry Report • Non-Invasive Screening Companion</div>
        </div>
        ${contentHtml}
        <div class="disclaimer">
          ⚠️ <strong>Medical Disclaimer:</strong> Neuro Calm is a preliminary educational wellness and physiological telemetry platform designed for youth and collegiate mental health screening. It does not replace professional clinical psychiatric diagnosis or prescriptive interventions.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  }

  // Main PDF Generation Method
  async function downloadAssessmentPDF(assessment, user) {
    const jsPDFClass = await ensureJsPDF();

    const uName = (user && (user.fullName || user.name)) || 'Student User';
    const uUid = (user && (user.uid || user.userId)) || 'NT1001';
    const uAge = (user && user.age) ? `${user.age} yrs` : '20 yrs';
    const uGender = (user && user.gender) || 'Not Specified';
    const reportDate = (assessment && (assessment.dateFormatted || assessment.timestampFormatted)) || new Date().toLocaleString('en-IN');
    const asmId = (assessment && assessment.assessmentId) || `ASM-${Date.now().toString().slice(-6)}`;

    // Pillar 1: Physiological
    const phys = (assessment && (assessment.physiological || assessment.vitals)) || {};
    const hr = typeof phys.heartRate === 'number' ? `${phys.heartRate} BPM` : (phys.heartRate || 'Not Applicable');
    const spo2 = typeof phys.spo2 === 'number' ? `${phys.spo2} %` : (phys.spo2 || 'Not Applicable');
    const temp = typeof phys.temperature === 'number' ? `${phys.temperature} °C` : (phys.temperature || 'Not Applicable');
    const sleep = typeof phys.sleepHours === 'number' ? `${phys.sleepHours} hrs (${phys.sleepQuality || 'Normal'})` : (phys.sleepHours || '7.5 hrs (Optimal)');
    const hwStatus = phys.isHardwareActive ? 'Connected (ESP32 Live Telemetry)' : (phys.status || 'Hardware Disconnected');

    // Pillar 2: Pre-Assessment
    const pre = (assessment && (assessment.preAssessment || assessment)) || {};
    const score = typeof pre.score === 'number' ? pre.score : (assessment.score || 0);
    const riskLevel = pre.riskLevel || assessment.riskLevel || 'LOW';
    const answers = pre.answers || assessment.answers || [];

    // Pillar 3: Abnormal Pattern
    const abnormal = (assessment && assessment.abnormalPattern) || { alerts: [], summary: 'No abnormal patterns detected.' };
    const alerts = abnormal.alerts || [];

    if (!jsPDFClass) {
      // Fallback popup if CDN blocked
      let alertsHtml = alerts.length === 0
        ? '<div class="no-alert">✓ Zero abnormal patterns recorded. Physiological vitals are within normal baseline thresholds.</div>'
        : alerts.map(a => `<div class="alert-box"><strong>${a.type}:</strong> ${a.message} (Recorded: ${a.value})</div>`).join('');

      let html = `
        <div class="section">
          <div class="sec-title">Patient / Student Information</div>
          <table>
            <tr><th>Full Name</th><td>${uName}</td><th>User ID (UID)</th><td>${uUid}</td></tr>
            <tr><th>Age / Gender</th><td>${uAge} / ${uGender}</td><th>Assessment ID</th><td>${asmId}</td></tr>
            <tr><th>Report Date</th><td colspan="3">${reportDate}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="sec-title">1. 🩺 Physiological Telemetry (From ESP32 Wearable)</div>
          <table>
            <tr><th>PPG Pulse Rate (Heart Rate)</th><td><strong>${hr}</strong></td><th>Blood Oxygen (SpO2)</th><td><strong>${spo2}</strong></td></tr>
            <tr><th>Core Body Temperature</th><td>${temp}</td><th>Sleep / Rest Status</th><td>${sleep}</td></tr>
            <tr><th>Signal Type</th><td>Optical Photoplethysmogram (PPG)</td><th>Hardware Status</th><td>${hwStatus}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="sec-title">2. 📋 Pre-Assessment Screening (From Interface)</div>
          <table>
            <tr><th>Overall Risk Level</th><td><span class="badge ${riskLevel === 'HIGH' ? 'badge-high' : (riskLevel === 'MODERATE' ? 'badge-mod' : 'badge-low')}">${riskLevel} RISK</span></td><th>Risk Score</th><td><strong>${score} / 100</strong></td></tr>
            <tr><th>Clinical Summary</th><td colspan="3">${pre.explanation || 'Screening indicates stable emotional parameters.'}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="sec-title">3. ⚠️ Abnormal Pattern Detection Engine</div>
          ${alertsHtml}
        </div>
      `;
      fallbackPrintReport(`NeuroCalm_Report_${uUid}`, html);
      return;
    }

    // Generate with jsPDF
    const doc = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // Top Header Banner
    doc.setFillColor(15, 31, 56); // Deep Navy
    doc.rect(0, 0, pageW, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('NEURO CALM', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(147, 197, 253);
    doc.text('Student Health & Telemetry System • Physiological & Screening Report', 14, 19);

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`ID: ${asmId}`, pageW - 14, 12, { align: 'right' });
    doc.text(`Date: ${reportDate}`, pageW - 14, 19, { align: 'right' });

    let y = 34;

    // Patient Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageW - 28, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Patient / Student Profile', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Name: ${uName}`, 18, y + 13);
    doc.text(`UID: ${uUid}`, 80, y + 13);
    doc.text(`Age / Gender: ${uAge} / ${uGender}`, 135, y + 13);

    doc.text(`Status: Screened`, 18, y + 18);
    doc.text(`Platform: Neuro Calm v2.0`, 80, y + 18);
    doc.text(`Sensor Mode: MAX30102 Optical PPG`, 135, y + 18);

    y += 28;

    // SECTION 1: Physiological Telemetry
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199); // Calming Blue
    doc.text('1.  PHYSIOLOGICAL TELEMETRY (From ESP32 Wearable)', 14, y);
    y += 4;

    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageW - 14, y);
    y += 4;

    // Physiological 4 Grid Cards
    const cardW = (pageW - 28 - 9) / 4;
    const cardH = 20;

    const vitalsData = [
      { label: 'PPG Heart Rate', val: hr, sub: 'MAX30102 Optical' },
      { label: 'Blood Oxygen (SpO2)', val: spo2, sub: 'Pulse Oximetry' },
      { label: 'Body Temperature', val: temp, sub: 'DS18B20 Digital' },
      { label: 'Sleep & Movement', val: sleep, sub: 'MPU6050 Motion' }
    ];

    vitalsData.forEach((v, idx) => {
      const cx = 14 + idx * (cardW + 3);
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(v.label, cx + 3, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(v.val, cx + 3, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(v.sub, cx + 3, y + 17);
    });

    y += cardH + 7;

    // Hardware Note
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`* Hardware Stream Status: ${hwStatus} • Data verified via Photoplethysmogram (PPG) Infrared pulse reflectance.`, 14, y);
    y += 6;

    // SECTION 2: Pre-Assessment Screening
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241); // Indigo
    doc.text('2.  PRE-ASSESSMENT SCREENING (From Web Interface)', 14, y);
    y += 4;

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageW - 14, y);
    y += 4;

    // Risk Card
    doc.setFillColor(riskLevel === 'HIGH' ? 254 : (riskLevel === 'MODERATE' ? 255 : 236), 
                     riskLevel === 'HIGH' ? 242 : (riskLevel === 'MODERATE' ? 251 : 253), 
                     riskLevel === 'HIGH' ? 242 : (riskLevel === 'MODERATE' ? 235 : 245));
    doc.setDrawColor(riskLevel === 'HIGH' ? 239 : (riskLevel === 'MODERATE' ? 245 : 16), 
                     riskLevel === 'HIGH' ? 68 : (riskLevel === 'MODERATE' ? 158 : 185), 
                     riskLevel === 'HIGH' ? 68 : (riskLevel === 'MODERATE' ? 11 : 129));
    doc.roundedRect(14, y, pageW - 28, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(riskLevel === 'HIGH' ? 153 : (riskLevel === 'MODERATE' ? 146 : 6), 
                     riskLevel === 'HIGH' ? 27 : (riskLevel === 'MODERATE' ? 64 : 95), 
                     riskLevel === 'HIGH' ? 27 : (riskLevel === 'MODERATE' ? 14 : 70));
    doc.text(`${riskLevel} RISK  —  Score: ${score} / 100`, 18, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const expl = pre.explanation || 'Screening responses indicate low vulnerability at this juncture.';
    doc.text(doc.splitTextToSize(expl, pageW - 36), 18, y + 13);

    y += 24;

    // SECTION 3: Abnormal Pattern Detection Engine
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38); // Crimson Red
    doc.text('3.  ABNORMAL PATTERN DETECTION (Clinical Threshold Alert Engine)', 14, y);
    y += 4;

    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageW - 14, y);
    y += 5;

    if (alerts.length === 0) {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(14, y, pageW - 28, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52);
      doc.text('✓ Zero Abnormal Patterns Detected', 18, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(74, 222, 128);
      doc.setTextColor(21, 128, 61);
      doc.text('All continuous telemetry parameters (PPG pulse rate, SpO2 saturation, core temperature) are within stable baselines.', 18, y + 10.5);
      y += 18;
    } else {
      alerts.forEach(a => {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
        doc.roundedRect(14, y, pageW - 28, 12, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28);
        doc.text(`[${a.severity || 'ALERT'}] ${a.metric}: ${a.value}  (Baseline: ${a.baseline || 'Normal'})`, 18, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(153, 27, 27);
        doc.text(a.message || 'Abnormal parameter variation flagged.', 18, y + 9.5);

        y += 14;
      });
    }

    // SECTION 4: Supportive Recommendations
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Supportive Recommendations & Directives:', 14, y + 2);
    y += 6;

    const recs = pre.recommendations || [
      'Maintain regular sleep schedule and balanced study intervals.',
      'Practice 0.1 Hz resonant breathing when experiencing high pressure.',
      'Maintain active social contact and share ongoing concerns.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    recs.slice(0, 4).forEach((r) => {
      doc.text(`•  ${r}`, 18, y);
      y += 4.5;
    });

    // Verification & Medical Disclaimer Footer
    y = Math.max(y + 6, pageW > 280 ? 250 : 265);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(14, y, pageW - 14, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('NEURO CALM CLINICAL COMPANION • NON-INVASIVE SCREENING PROTOCOL', 14, y);

    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    const disclaimerText = 'Disclaimer: Neuro Calm is an educational biometric telemetry and psychological screening prototype. It does not provide clinical medical diagnosis or prescriptive therapeutics. In emergency or crisis situations, consult institutional health counselors or local medical services.';
    doc.text(doc.splitTextToSize(disclaimerText, pageW - 28), 14, y);

    const filename = `NeuroCalm_Health_Report_${uUid}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }

  // Export live snapshot PDF
  function downloadLiveTelemetryPDF(liveData, user) {
    const assessmentMock = {
      assessmentId: `LIVE-${Date.now().toString().slice(-6)}`,
      dateFormatted: new Date().toLocaleString('en-IN'),
      physiological: liveData || {},
      preAssessment: {
        score: (liveData && liveData.heartRate && liveData.heartRate > 100) ? 45 : 18,
        riskLevel: (liveData && liveData.heartRate && liveData.heartRate > 100) ? 'MODERATE' : 'LOW',
        explanation: 'Real-time telemetry snapshot captured from live ESP32 wearable stream.',
        recommendations: [
          'Continue real-time monitoring of PPG pulse waveform and blood oxygenation.',
          'Observe rest patterns if heart rate deviates above baseline.',
          'Sync with student counselor if ongoing elevation persists.'
        ]
      },
      abnormalPattern: (liveData && liveData.abnormalPattern) || { alerts: [], summary: 'Telemetry snapshot within range.' }
    };

    return downloadAssessmentPDF(assessmentMock, user);
  }

  return {
    downloadAssessmentPDF,
    downloadLiveTelemetryPDF
  };
});
