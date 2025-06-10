const os = require('os');
const fetch = require('node-fetch');

const CREATE_URL = 'http://localhost:4000/webhooks/metric/create';
const UPDATE_URL = 'http://localhost:4000/webhooks/metric/update';
const PUSH_INTERVAL = 60 * 1000;

// --- Helpers ---
function getCPUUsagePercent() {
    return new Promise(resolve => {
        const start = os.cpus();
        setTimeout(() => {
            const end = os.cpus();
            let idleDiff = 0, totalDiff = 0;
            for (let i = 0; i < start.length; i++) {
                const s = start[i].times, e = end[i].times;
                const idle = e.idle - s.idle;
                const total = Object.keys(s).reduce((acc, t) => acc + (e[t] - s[t]), 0);
                idleDiff += idle;
                totalDiff += total;
            }
            const usage = 100 - (idleDiff / totalDiff) * 100;
            resolve(Number(usage.toFixed(2)));
        }, 100);
    });
}

function getMemoryUsagePercent() {
    const free = os.freemem();
    const total = os.totalmem();
    return Number((((total - free) / total) * 100).toFixed(2));
}

// Create metrics (first run, idempotent)
async function ensureMetricsExist(metricsArray) {
    try {
        const response = await fetch(CREATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metrics: metricsArray }),
        });
        // Log result, but ignore errors about duplicates
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            console.warn('Metric creation API response:', data);
        }
    } catch (err) {
        console.warn('Error during metric creation:', err.message);
    }
}

// Update metrics (continuous)
async function updateMetrics(metricsArray) {
    try {
        const response = await fetch(UPDATE_URL, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metricsArray), // array as root!
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            console.error('API Status:', response.status);
            console.error('API Response:', data);
            throw new Error(data.error || JSON.stringify(data) || 'Update failed');
        }
        if (data && data.results) {
            data.results.forEach(r => {
                if (r.success) {
                    console.log(`[${new Date().toISOString()}] Updated ${r.metric.metricName}: ${r.metric.value}`);
                } else {
                    console.error(`Metric update failed for:`, r.input, 'Reason:', r.error);
                }
            });
        } else {
            metricsArray.forEach(({ name, value }) =>
                console.log(`[${new Date().toISOString()}] Updated ${name}: ${value}`)
            );
        }
    } catch (err) {
        console.error(`Error updating metrics:`, err.message);
    }
}

async function mainLoop() {
    // First: Ensure metrics exist (ignore duplicate errors)
    const metricsMeta = [
        { name: 'pc_cpu_usage_percent', value: 0 },
        { name: 'pc_mem_usage_percent', value: 0 }
    ];
    await ensureMetricsExist(metricsMeta);

    // Now: Loop for continuous updates
    while (true) {
        const cpu = await getCPUUsagePercent();
        const mem = getMemoryUsagePercent();

        // Update both by name
        await updateMetrics([
            { name: 'pc_cpu_usage_percent', value: cpu },
            { name: 'pc_mem_usage_percent', value: mem }
        ]);

        await new Promise(resolve => setTimeout(resolve, PUSH_INTERVAL));
    }
}

// --- Start ---
mainLoop();
