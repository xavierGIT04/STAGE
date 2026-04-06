const API = {

    async getPhases() {
        try {
            const res = await fetch(`${CONFIG.API_URL}/phases`);
            if (!res.ok) throw new Error('Erreur réseau');
            return await res.json();
        } catch (err) {
            console.warn('API indisponible, données fictives utilisées.', err);
            return CONFIG.MOCK.phases;
        }
    },

    async getFactorHistory(phase, factor, date, timeStart, timeEnd) {
        try {
            const params = new URLSearchParams({ phase, factor, date });
            if (timeStart) params.append('timeStart', timeStart);
            if (timeEnd)   params.append('timeEnd',   timeEnd);
            const res = await fetch(`${CONFIG.API_URL}/history?${params}`);
            if (!res.ok) throw new Error('Erreur réseau');
            return await res.json();
        } catch (err) {
            console.warn('API indisponible, données fictives utilisées.', err);
            return this._mockHistory(phase, factor, date, timeStart, timeEnd);
        }
    },

    _mockHistory(phase, factor, date, timeStart, timeEnd) {
        const base = CONFIG.MOCK.history[factor];
        const vary = v => Math.round((v + (Math.random() - 0.5) * 0.08 * v) * 100) / 100;

        // Génère tous les points 24h
        const allPoints = base.map((value, i) => ({
            time: `${String(i).padStart(2, '0')}h`,
            value: vary(value)
        }));

        // Filtre par plage si les deux bornes sont définies
        if (timeStart && timeEnd && timeStart !== '' && timeEnd !== '') {
            const start = parseInt(timeStart.split(':')[0]);
            const end   = parseInt(timeEnd.split(':')[0]);

            // Gère le cas où fin < début (ex: 22h → 02h)
            const filtered = allPoints.filter(p => {
                const h = parseInt(p.time);
                return start <= end
                    ? h >= start && h <= end
                    : h >= start || h <= end;
            });

            return { phase, factor, date, timeStart, timeEnd, data: filtered };
        }

        // Filtre par heure de début uniquement
        if (timeStart && timeStart !== '') {
            const start = parseInt(timeStart.split(':')[0]);
            const filtered = allPoints.filter(p => parseInt(p.time) >= start);
            return { phase, factor, date, timeStart, timeEnd: null, data: filtered };
        }

        // Filtre par heure de fin uniquement
        if (timeEnd && timeEnd !== '') {
            const end = parseInt(timeEnd.split(':')[0]);
            const filtered = allPoints.filter(p => parseInt(p.time) <= end);
            return { phase, factor, date, timeStart: null, timeEnd, data: filtered };
        }

        // Aucun filtre → 24h complet
        return { phase, factor, date, timeStart: null, timeEnd: null, data: allPoints };
    }
};