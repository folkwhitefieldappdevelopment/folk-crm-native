import { getApiClient, getToken } from './api-client';

export async function queueMail(data: {
  to: string[];
  subject: string;
  html: string;
}): Promise<any> {
  const api = getApiClient();
  const response = await api.post('/mail', data);
  return response.data;
}

export async function sendEmailReport(data: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  try {
    const token = await getToken();
    if (!token) return { sent: false, reason: 'Not authenticated' };

    const api = getApiClient();
    const response = await api.post('/mail/send', data);
    return response.data as { sent: boolean; reason?: string };
  } catch (err: any) {
    return {
      sent: false,
      reason: err?.message || 'Unknown error',
    };
  }
}

export async function queuePulseReport(
  to: string,
  group: any,
  insights: any,
  aiReport: any
): Promise<boolean> {
  const dangerZoneHtml =
    insights.dangerZone
      .slice(0, 10)
      .map(
        (p: any) => `
    <div style="margin-bottom:20px;padding:15px;border:1px solid #ffcdd2;border-radius:10px;background-color:#fff9f9;">
      <table width="100%">
        <tr>
          <td width="60" valign="top">
            <img src="${p.photoUrl || ''}" width="50" height="50" style="border-radius:50%;object-fit:cover;" />
          </td>
          <td>
            <div style="font-weight:bold;color:#b71c1c;">${p.fullName}</div>
            <div style="font-size:12px;color:#757575;">${
              p.phone
            } | ${p.currentFolkStage}</div>
            <div style="font-size:11px;margin-top:5px;">Enabler: ${
              p.enablerInTouchWith || 'Unassigned'
            }</div>
          </td>
        </tr>
      </table>
    </div>`
      )
      .join('');

  const starPerformersHtml = insights.starPerformers
    .slice(0, 5)
    .map(
      (p: any) =>
        `<li style="margin-bottom:8px;"><b>${p.fullName}</b> (${
          p.attendanceHistory?.length || 0
        } Check-ins)</li>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto;border:1px solid #eee;padding:20px;border-radius:15px;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#3f51b5;margin-bottom:5px;text-transform:uppercase;letter-spacing:2px;">Daily Pulse Report</h1>
        <div style="font-size:14px;font-weight:bold;color:#666;">${group.name}</div>
      </div>
      <div style="background-color:#f5f5f5;padding:15px;border-radius:10px;margin-bottom:30px;">
        <h2 style="font-size:16px;margin-top:0;color:#3f51b5;">AI EXECUTIVE INSIGHT</h2>
        <p style="font-style:italic;line-height:1.6;">"${aiReport.executiveSummary}"</p>
      </div>
      <div style="margin-bottom:30px;">
        <h3 style="font-size:14px;color:#2e7d32;text-transform:uppercase;">Key Successes</h3>
        <ul style="padding-left:20px;">${aiReport.keyWins
          .map((w: string) => `<li>${w}</li>`)
          .join('')}</ul>
      </div>
      <div style="margin-bottom:30px;">
        <h3 style="font-size:14px;color:#e65100;text-transform:uppercase;">Growth Areas</h3>
        <ul style="padding-left:20px;">${aiReport.concerns
          .map((c: string) => `<li>${c}</li>`)
          .join('')}</ul>
      </div>
      <div style="margin-bottom:30px;border-top:2px solid #eee;padding-top:20px;">
        <h3 style="font-size:14px;color:#b71c1c;text-transform:uppercase;">Attention Required (Danger Zone)</h3>
        <p style="font-size:12px;color:#666;margin-bottom:15px;">These contacts have not been reached in 4+ days.</p>
        ${dangerZoneHtml}
      </div>
      <div style="margin-bottom:30px;">
        <h3 style="font-size:14px;color:#3f51b5;text-transform:uppercase;">Star Performers</h3>
        <ul>${starPerformersHtml}</ul>
      </div>
      <div style="text-align:center;font-size:10px;color:#999;margin-top:40px;border-top:1px solid #eee;padding-top:20px;">
        This is an automated pulse report from FOLK Spiritual Gems CRM.<br/>
        Generated on ${new Date().toLocaleString()}
      </div>
    </div>
  `;

  try {
    await queueMail({
      to: [to],
      subject: `Outreach Pulse: ${group.name} - ${new Date().toLocaleDateString()}`,
      html,
    });
    return true;
  } catch (e) {
    console.error('Mailing queue failed', e);
    throw e;
  }
}
