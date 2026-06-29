import { computeGroupReportData, type GroupReportData } from './intelligence-service';
import { differenceInDays } from 'date-fns';

function safeDate(date: any): Date | null {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

function daysAgo(date: Date | null): string {
  if (!date) return 'Never';
  const days = differenceInDays(new Date(), date);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function badgeHtml(label: string, color: string): string {
  return `<span style="display:inline-block;background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold;margin:1px;">${label}</span>`;
}

function memberBadges(memberReport: any): string {
  const badges: string[] = [];
  if (memberReport.categories.includes('emergency'))
    badges.push(badgeHtml('EMERGENCY', '#C62828'));
  if (memberReport.categories.includes('danger'))
    badges.push(badgeHtml('DANGER', '#f44336'));
  if (memberReport.categories.includes('at-risk'))
    badges.push(badgeHtml('AT RISK', '#FF9800'));
  if (memberReport.categories.includes('active'))
    badges.push(badgeHtml('ACTIVE', '#4CAF50'));
  if (memberReport.categories.includes('progressing'))
    badges.push(badgeHtml('PROGRESSING', '#2196F3'));
  if (memberReport.categories.includes('declining'))
    badges.push(badgeHtml('DECLINING', '#9C27B0'));
  return badges.join(' ') || badgeHtml('NO DATA', '#9E9E9E');
}

export function generateGroupReportHtml(group: any, people: any[]): string {
  const data = computeGroupReportData(group, people);
  const now = new Date();

  const memberRows = data.members
    .map(
      (m) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;font-size:13px;">${
        m.person.fullName || 'Unknown'
      }</td>
      <td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;">${
        m.person.currentFolkStage || '\u2014'
      }</td>
      <td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;">${
        m.person.phone || '\u2014'
      }</td>
      <td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;">${daysAgo(
        safeDate(m.person.lastCallAt)
      )}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;">${
        m.person.lastCallStatus || '\u2014'
      }</td>
      <td style="padding:10px;border-bottom:1px solid #eee;font-size:12px;">${
        m.eventsAttended
      }</td>
      <td style="padding:10px;border-bottom:1px solid #eee;">${memberBadges(
        m
      )}</td>
    </tr>`
    )
    .join('');

  const emergencyRows = data.members
    .filter((m) => m.isEmergency)
    .slice(0, 20)
    .map((m) => {
      const lastCall = safeDate(m.person.lastCallAt);
      return ` <tr>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-weight:bold;font-size:13px;">${
        m.person.fullName || 'Unknown'
      }</td>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-size:12px;">${daysAgo(
        lastCall
      )}</td>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-size:12px;">Chanting: ${
        m.person.chantingStatus || 0
      }</td>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-size:12px;">${
        m.person.location || '\u2014'
      }</td>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-size:12px;">${
        m.person.enablerInTouchWith || 'Unassigned'
      }</td>
    </tr>`;
    })
    .join('');

  const dangerRows = data.members
    .filter((m) => m.isDangerZone && !m.isEmergency)
    .slice(0, 20)
    .map((m) => {
      const lastCall = safeDate(m.person.lastCallAt);
      return ` <tr>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-weight:bold;font-size:13px;">${
        m.person.fullName || 'Unknown'
      }</td>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-size:12px;">${daysAgo(
        lastCall
      )}</td>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-size:12px;">${
        m.person.lastCallStatus || '\u2014'
      }</td>
      <td style="padding:8px;border-bottom:1px solid #ffcdd2;font-size:12px;">${
        m.person.enablerInTouchWith || 'Unassigned'
      }</td>
    </tr>`;
    })
    .join('');

  const activeRows = data.members
    .filter((m) => m.isActive)
    .slice(0, 30)
    .map((m) => {
      const lastCall = safeDate(m.person.lastCallAt);
      return ` <tr>
      <td style="padding:8px;border-bottom:1px solid #c8e6c9;font-weight:bold;font-size:13px;">${
        m.person.fullName || 'Unknown'
      }</td>
      <td style="padding:8px;border-bottom:1px solid #c8e6c9;font-size:12px;">${
        m.person.currentFolkStage || '\u2014'
      }</td>
      <td style="padding:8px;border-bottom:1px solid #c8e6c9;font-size:12px;">${daysAgo(
        lastCall
      )}</td>
      <td style="padding:8px;border-bottom:1px solid #c8e6c9;font-size:12px;">${
        m.eventsAttended
      } events</td>
      <td style="padding:8px;border-bottom:1px solid #c8e6c9;font-size:12px;">${
        m.person.lastCallStatus || '\u2014'
      }</td>
    </tr>`;
    })
    .join('');

  const progressingRows = data.members
    .filter((m) => m.categories.includes('progressing'))
    .slice(0, 20)
    .map((m) => {
      const lastCall = safeDate(m.person.lastCallAt);
      return ` <tr>
      <td style="padding:8px;border-bottom:1px solid #bbdefb;font-weight:bold;font-size:13px;">${
        m.person.fullName || 'Unknown'
      }</td>
      <td style="padding:8px;border-bottom:1px solid #bbdefb;font-size:12px;">${
        m.person.currentFolkStage || '\u2014'
      }</td>
      <td style="padding:8px;border-bottom:1px solid #bbdefb;font-size:12px;">${daysAgo(
        lastCall
      )}</td>
      <td style="padding:8px;border-bottom:1px solid #bbdefb;font-size:12px;">${
        m.eventsAttended
      } events</td>
      <td style="padding:8px;border-bottom:1px solid #bbdefb;font-size:12px;">${
        m.person.lastCallRemark?.slice(0, 60) || '\u2014'
      }</td>
    </tr>`;
    })
    .join('');

  const enablerStats: Record<string, { total: number; a1: number }> = {};
  people.forEach((p) => {
    (p.callHistory || []).forEach((log: any) => {
      const logDate = safeDate(log.calledAt);
      if (logDate && differenceInDays(now, logDate) <= 7) {
        const name = log.callerName || 'System';
        if (!enablerStats[name]) enablerStats[name] = { total: 0, a1: 0 };
        enablerStats[name].total++;
        if (log.status === 'A1 - Coming') enablerStats[name].a1++;
      }
    });
  });
  const leaderboard = Object.entries(enablerStats)
    .sort((a, b) => b[1].a1 - a[1].a1)
    .slice(0, 10);
  const enablerRows = leaderboard
    .map(
      ([name, stats], i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;font-size:13px;">${
        i + 1
      }. ${name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${
        stats.total
      }</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${
        stats.a1
      }</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @media only screen and (max-width:600px) {
    .stat-card { min-width: calc(50% - 16px) !important; }
    table { font-size: 11px !important; }
    td, th { padding: 6px !important; }
  }
</style>
</head>
<body style="font-family:Arial,sans-serif;color:#333;margin:0;padding:0;background:#f0f2f5;">
<div style="max-width:800px;margin:auto;padding:16px;">

  <div style="background:linear-gradient(135deg,#1a237e,#3F51B5);color:#fff;padding:32px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:22px;text-transform:uppercase;letter-spacing:2px;">FOLK Group Report</h1>
    <p style="margin:8px 0 0;opacity:0.85;font-size:13px;">${group.name}</p>
    <p style="margin:4px 0 0;opacity:0.6;font-size:11px;">${now.toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )}</p>
  </div>

  <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="display:flex;gap:12px;margin-bottom:32px;flex-wrap:wrap;">
      <div class="stat-card" style="flex:1;min-width:100px;background:#E8F5E9;padding:16px;border-radius:12px;text-align:center;">
        <div style="font-size:32px;font-weight:bold;color:#2E7D32;">${
          data.totalMembers
        }</div>
        <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">Total Souls</div>
      </div>
      <div class="stat-card" style="flex:1;min-width:100px;background:#E3F2FD;padding:16px;border-radius:12px;text-align:center;">
        <div style="font-size:32px;font-weight:bold;color:#1565C0;">${
          data.activeCount
        }</div>
        <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">Active (7d)</div>
      </div>
      <div class="stat-card" style="flex:1;min-width:100px;background:#FFF3E0;padding:16px;border-radius:12px;text-align:center;">
        <div style="font-size:32px;font-weight:bold;color:#E65100;">${
          data.atRiskCount
        }</div>
        <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">At Risk</div>
      </div>
      <div class="stat-card" style="flex:1;min-width:100px;background:#FFEBEE;padding:16px;border-radius:12px;text-align:center;">
        <div style="font-size:32px;font-weight:bold;color:#C62828;">${
          data.dangerCount
        }</div>
        <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">Danger Zone</div>
      </div>
      <div class="stat-card" style="flex:1;min-width:100px;background:#fce4ec;padding:16px;border-radius:12px;text-align:center;">
        <div style="font-size:32px;font-weight:bold;color:#880E4F;">${
          data.emergencyCount
        }</div>
        <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">Emergency</div>
      </div>
    </div>

    ${
      data.emergencyCount > 0
        ? `
    <div style="margin-bottom:28px;border:2px solid #C62828;border-radius:12px;padding:20px;background:#FFF0F0;">
      <h2 style="margin:0 0 4px;font-size:15px;color:#C62828;text-transform:uppercase;letter-spacing:1px;">🚨 Emergency — Immediate Attention</h2>
      <p style="font-size:12px;color:#666;margin-bottom:12px;">Not chanting, not attending programs, not meeting FG. Needs urgent follow-up.</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#C62828;color:#fff;"><th style="padding:8px;text-align:left;">Name</th><th style="padding:8px;text-align:left;">Last Call</th><th style="padding:8px;text-align:left;">Chanting</th><th style="padding:8px;text-align:left;">Location</th><th style="padding:8px;text-align:left;">Enabler</th></tr></thead>
        <tbody>${emergencyRows}</tbody>
      </table>
    </div>`
        : ''
    }

    ${
      data.dangerCount > 0
        ? `
    <div style="margin-bottom:28px;border:2px solid #f44336;border-radius:12px;padding:20px;background:#FFF5F5;">
      <h2 style="margin:0 0 4px;font-size:15px;color:#f44336;text-transform:uppercase;letter-spacing:1px;">⚠ Danger Zone — Not Reached in 4+ Days</h2>
      <p style="font-size:12px;color:#666;margin-bottom:12px;">These members need a call today.</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f44336;color:#fff;"><th style="padding:8px;text-align:left;">Name</th><th style="padding:8px;text-align:left;">Last Call</th><th style="padding:8px;text-align:left;">Status</th><th style="padding:8px;text-align:left;">Enabler</th></tr></thead>
        <tbody>${dangerRows}</tbody>
      </table>
    </div>`
        : ''
    }

    ${
      data.members.filter((m) => m.categories.includes('progressing')).length > 0
        ? `
    <div style="margin-bottom:28px;border:2px solid #2196F3;border-radius:12px;padding:20px;background:#F3F9FF;">
      <h2 style="margin:0 0 4px;font-size:15px;color:#1565C0;text-transform:uppercase;letter-spacing:1px;">⭐ Progressing Members</h2>
      <p style="font-size:12px;color:#666;margin-bottom:12px;">Confirmed A1 and attending events regularly.</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#2196F3;color:#fff;"><th style="padding:8px;text-align:left;">Name</th><th style="padding:8px;text-align:left;">Stage</th><th style="padding:8px;text-align:left;">Last Call</th><th style="padding:8px;text-align:left;">Events</th><th style="padding:8px;text-align:left;">Remark</th></tr></thead>
        <tbody>${progressingRows}</tbody>
      </table>
    </div>`
        : ''
    }

    ${
      data.activeCount > 0
        ? `
    <div style="margin-bottom:28px;border:2px solid #4CAF50;border-radius:12px;padding:20px;background:#F1F8E9;">
      <h2 style="margin:0 0 4px;font-size:15px;color:#2E7D32;text-transform:uppercase;letter-spacing:1px;">✅ Active Members (Called within 7 days)</h2>
      <p style="font-size:12px;color:#666;margin-bottom:12px;">These members are being engaged regularly.</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#4CAF50;color:#fff;"><th style="padding:8px;text-align:left;">Name</th><th style="padding:8px;text-align:left;">Stage</th><th style="padding:8px;text-align:left;">Last Call</th><th style="padding:8px;text-align:left;">Events</th><th style="padding:8px;text-align:left;">Status</th></tr></thead>
        <tbody>${activeRows}</tbody>
      </table>
    </div>`
        : ''
    }

    ${
      enablerRows
        ? `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:15px;color:#3F51B5;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">🏆 Enabler Leaderboard (Last 7 Days)</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#3F51B5;color:#fff;"><th style="padding:10px;text-align:left;">Enabler</th><th style="padding:10px;text-align:left;">Total Calls</th><th style="padding:10px;text-align:left;">A1 Confirmations</th></tr></thead>
        <tbody>${enablerRows}</tbody>
      </table>
    </div>`
        : ''
    }

    <div style="margin-bottom:20px;">
      <h2 style="font-size:15px;color:#1a237e;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">📋 Complete Member Overview</h2>
      <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#1a237e;color:#fff;">
          <th style="padding:10px;text-align:left;">Name</th>
          <th style="padding:10px;text-align:left;">Stage</th>
          <th style="padding:10px;text-align:left;">Phone</th>
          <th style="padding:10px;text-align:left;">Last Call</th>
          <th style="padding:10px;text-align:left;">Status</th>
          <th style="padding:10px;text-align:left;">Events</th>
          <th style="padding:10px;text-align:left;">Tags</th>
        </tr></thead>
        <tbody>${memberRows}</tbody>
      </table>
      </div>
    </div>

    <div style="text-align:center;font-size:10px;color:#999;margin-top:40px;border-top:1px solid #eee;padding-top:20px;">
      Automated report from <strong>FOLK Spiritual Gems CRM</strong>.<br>
      Generated on ${now.toLocaleString()}
    </div>
  </div>
</div>
</body>
</html>`;
}
