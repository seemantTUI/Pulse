// app/hooks/useMultipleRuleBreachLogs.ts
'use client';
import useRuleBreachLogs from './useRuleBreachLogs';

// Always call the hook twice, never in a loop.
export default function useMultipleRuleBreachLogs(ruleIds: string[]) {
    const hook0 = useRuleBreachLogs(ruleIds[0] || '');
    const hook1 = useRuleBreachLogs(ruleIds[1] || '');

    // Collect logs for each ID only if present.
    const logsById: Record<string, any[]> = {};
    if (ruleIds[0]) logsById[ruleIds[0]] = hook0.logs;
    if (ruleIds[1]) logsById[ruleIds[1]] = hook1.logs;

    // Loading if either hook is loading.
    const loading = hook0.loading || hook1.loading;

    return { logsById, loading };
}
