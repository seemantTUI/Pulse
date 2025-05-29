function parseDuration(durationStr) {
    if (!durationStr) return 0;

    const regex = /(?:(\\d+)d)?(?:(\\d+)h)?(?:(\\d+)m)?/;
    const match = durationStr.match(/(?:(\\d+)d)?(?:(\\d+)h)?(?:(\\d+)m)?/);

    if (!match) return 0;

    const [, days = 0, hours = 0, minutes = 0] = match.map(Number);
    return ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
}

module.exports = { parseDuration };
