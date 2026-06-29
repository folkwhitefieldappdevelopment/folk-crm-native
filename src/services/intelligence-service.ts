import { differenceInDays } from 'date-fns';

export type MemberReportCategory =
  | 'active'
  | 'at-risk'
  | 'danger'
  | 'emergency'
  | 'progressing'
  | 'declining';

export interface MemberReport {
  person: any;
  daysSinceLastCall: number;
  callFrequency: number;
  eventsAttended: number;
  isActive: boolean;
  isAtRisk: boolean;
  isDangerZone: boolean;
  isEmergency: boolean;
  categories: MemberReportCategory[];
}

export interface GroupReportData {
  group: any;
  members: MemberReport[];
  totalMembers: number;
  activeCount: number;
  atRiskCount: number;
  dangerCount: number;
  emergencyCount: number;
}

export interface IntelligenceInsights {
  dangerZone: any[];
  starPerformers: any[];
  enablerLeaderboard: { name: string; totalCalls: number; a1Count: number }[];
  summary: {
    totalMembers: number;
    activeCount: number;
    dangerCount: number;
    successRate: number;
  };
}

function safeDate(date: any): Date | null {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

export function calculateMemberReport(person: any): MemberReport {
  const now = new Date();
  const lastCall = safeDate(person.lastCallAt);
  const daysSinceLastCall = lastCall ? differenceInDays(now, lastCall) : 999;

  const callHistory = person.callHistory || [];
  const recentCalls = callHistory.filter((c: any) => {
    const d = safeDate(c.calledAt);
    return d && differenceInDays(now, d) <= 30;
  });
  const callFrequency = recentCalls.length;

  const eventsAttended = person.attendanceHistory?.length || 0;

  const isActive = daysSinceLastCall <= 7;
  const isAtRisk = daysSinceLastCall > 3 && daysSinceLastCall <= 7;
  const isDangerZone =
    daysSinceLastCall >= 4 &&
    !['A2 - Not Interested', 'A3 - Wrong Number'].includes(
      person.lastCallStatus || ''
    );
  const isEmergency =
    daysSinceLastCall >= 7 &&
    (person.chantingStatus || 0) === 0 &&
    person.lastCallStatus !== 'A1 - Coming';

  const categories: MemberReportCategory[] = [];
  if (isActive) categories.push('active');
  if (isAtRisk) categories.push('at-risk');
  if (isDangerZone) categories.push('danger');
  if (isEmergency) categories.push('emergency');

  if (person.lastCallStatus === 'A1 - Coming' && eventsAttended >= 2) {
    categories.push('progressing');
  }
  if (daysSinceLastCall >= 14 && eventsAttended === 0) {
    categories.push('declining');
  }

  return {
    person,
    daysSinceLastCall,
    callFrequency,
    eventsAttended,
    isActive,
    isAtRisk,
    isDangerZone,
    isEmergency,
    categories,
  };
}

export function computeGroupReportData(
  group: any,
  people: any[]
): GroupReportData {
  const members = people.map(calculateMemberReport);

  return {
    group,
    members,
    totalMembers: members.length,
    activeCount: members.filter((m) => m.isActive).length,
    atRiskCount: members.filter((m) => m.isAtRisk).length,
    dangerCount: members.filter((m) => m.isDangerZone).length,
    emergencyCount: members.filter((m) => m.isEmergency).length,
  };
}

export async function calculateGroupInsights(
  people: any[]
): Promise<IntelligenceInsights> {
  const now = new Date();
  const dangerZone: any[] = [];
  const starPerformers: any[] = [];
  const enablerStats: Record<string, { total: number; a1: number }> = {};

  let activeCount = 0;
  let totalA1s = 0;

  people.forEach((p) => {
    const lastCall = safeDate(p.lastCallAt);
    const daysSince = lastCall ? differenceInDays(now, lastCall) : 999;

    if (
      daysSince >= 4 &&
      !['A2 - Not Interested', 'A3 - Wrong Number'].includes(
        p.lastCallStatus || ''
      )
    ) {
      dangerZone.push(p);
    }

    const attCount = p.attendanceHistory?.length || 0;
    if (attCount >= 3) {
      starPerformers.push(p);
    }

    if (lastCall && differenceInDays(now, lastCall) <= 7) {
      activeCount++;
    }

    if (p.callHistory && Array.isArray(p.callHistory)) {
      p.callHistory.forEach((log: any) => {
        const logDate = safeDate(log.calledAt);
        if (logDate && differenceInDays(now, logDate) <= 7) {
          const enabler = log.callerName || 'System';
          if (!enablerStats[enabler])
            enablerStats[enabler] = { total: 0, a1: 0 };
          enablerStats[enabler].total++;
          if (log.status === 'A1 - Coming') {
            enablerStats[enabler].a1++;
            totalA1s++;
          }
        }
      });
    }
  });

  const leaderboard = Object.entries(enablerStats)
    .map(([name, stats]) => ({
      name,
      totalCalls: stats.total,
      a1Count: stats.a1,
    }))
    .sort((a, b) => b.a1Count - a.a1Count);

  return {
    dangerZone: dangerZone.sort((a, b) => {
      const da = safeDate(a.lastCallAt)?.getTime() || 0;
      const db = safeDate(b.lastCallAt)?.getTime() || 0;
      return da - db;
    }),
    starPerformers: starPerformers.sort(
      (a, b) =>
        (b.attendanceHistory?.length || 0) - (a.attendanceHistory?.length || 0)
    ),
    enablerLeaderboard: leaderboard,
    summary: {
      totalMembers: people.length,
      activeCount,
      dangerCount: dangerZone.length,
      successRate:
        people.length > 0
          ? Math.round((totalA1s / people.length) * 100)
          : 0,
    },
  };
}
