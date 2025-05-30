const os = require('os');
const fetch = require('node-fetch'); // v2 syntax

// === CONFIG ===
const WEBHOOK_URL = '${process.env.NEXT_PUBLIC_API_URL}/webhooks/push'; // <-- replace with your API URL!
const PUSH_INTERVAL = 60 * 1000; // Push every 1 min

// Helper: fetch CPU usage as % over 100ms
function getCPUUsagePercent() {
    return new Promise(resolve => {
        const start = os.cpus();
        setTimeout(() => {
            const end = os.cpus();
            let idleDiff = 0;
            let totalDiff = 0;
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

// Helper: get memory stats
function getMemoryUsagePercent() {
    const free = os.freemem();
    const total = os.totalmem();
    return Number((((total - free) / total) * 100).toFixed(2));
}

// Post to webhook
async function pushMetric(name, value) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, value }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            console.error('API Response:', data);
            throw new Error(data.error || JSON.stringify(data) || 'Push failed');
        }
        console.log(`[${new Date().toISOString()}] Sent ${name}: ${value}`);
    } catch (err) {
        console.error(`Error pushing metric '${name}':`, err.message);
    }
}


async function mainLoop() {
    while (true) {
        // CPU
        const cpu = await getCPUUsagePercent();
        await pushMetric('pc_cpu_usage_percent', cpu);

        // Memory
        const mem = getMemoryUsagePercent();
        await pushMetric('pc_mem_usage_percent', mem);

        // You can add more metrics if needed, e.g. disk usage, uptime, etc

        await new Promise(resolve => setTimeout(resolve, PUSH_INTERVAL));
    }
}

// --- Start ---
mainLoop();
