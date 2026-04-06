const Dashboard = (() => {

    let state = {
        selectedFactor:  'energie',
        selectedPhases:  ['L1'],
        selectedDate:    new Date().toISOString().split('T')[0],
        timeStart:       null,
        timeEnd:         null,
        isDark:          false
    };

    async function init() {
        document.getElementById('dateInput').value  = state.selectedDate;
        document.getElementById('timeStart').value  = '';
        document.getElementById('timeEnd').value    = '';
        await loadPhases();
        await loadChart();
        bindEvents();
    }

    async function loadPhases() {
        const phases = await API.getPhases();
        renderPhases(phases);
    }

    function renderPhases(phases) {
        document.getElementById('phasesRow').innerHTML = phases.map(p => `
            <div class="phase-block phase-${p.id.toLowerCase()}">
                <div class="phase-label">
                    <div class="phase-name">
                        <span class="phase-dot"></span>${p.label}
                    </div>
                    <span class="phase-status">Actif</span>
                </div>
                <div class="kpi-row">
                    ${CONFIG.FACTORS.map(f => `
                        <div class="kpi">
                            <div class="kpi-name">${f.label}</div>
                            <div class="kpi-value">
                                ${p.indicators[f.key]}<span class="kpi-unit">${f.unit}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    async function loadChart() {
        document.getElementById('chartLoader').classList.remove('hidden');
        const { selectedFactor, selectedPhases, selectedDate, timeStart, timeEnd, isDark } = state;

        const histories = await Promise.all(
            selectedPhases.map(phase =>
                API.getFactorHistory(phase, selectedFactor, selectedDate, timeStart, timeEnd)
            )
        );

        EnergyChart.render(histories, selectedFactor, selectedPhases, isDark);
        updateChartHeader();
        document.getElementById('chartLoader').classList.add('hidden');
    }

    function updateChartHeader() {
        const factor  = CONFIG.FACTORS.find(f => f.key === state.selectedFactor);
        const parts   = state.selectedDate.split('-');
        const date    = `${parts[2]}/${parts[1]}/${parts[0]}`;
        const phases  = state.selectedPhases.join(', ');

        // Affichage de la plage horaire
        let plage = '';
        if (state.timeStart && state.timeEnd) {
            plage = ` · ${state.timeStart} → ${state.timeEnd}`;
        } else if (state.timeStart) {
            plage = ` · À partir de ${state.timeStart}`;
        } else if (state.timeEnd) {
            plage = ` · Jusqu'à ${state.timeEnd}`;
        }

        document.getElementById('chartTitle').textContent =
            `${factor.label} — ${date}`;
        document.getElementById('chartSubtitle').textContent =
            `Phase ${phases}${plage || ' · Journée complète'}`;
    }

    function bindEvents() {

        document.getElementById('factorGroup').addEventListener('click', e => {
            const btn = e.target.closest('.factor-btn');
            if (!btn) return;
            document.querySelectorAll('.factor-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedFactor = btn.dataset.key;
            loadChart();
        });

        document.getElementById('phaseGroup').addEventListener('click', e => {
            const btn = e.target.closest('.phase-btn');
            if (!btn) return;
            const phase = btn.dataset.phase;
            if (state.selectedPhases.includes(phase)) {
                if (state.selectedPhases.length === 1) return;
                state.selectedPhases = state.selectedPhases.filter(p => p !== phase);
                btn.classList.remove('active');
            } else {
                state.selectedPhases.push(phase);
                btn.classList.add('active');
            }
            loadChart();
        });

        document.getElementById('dateInput').addEventListener('change', e => {
            state.selectedDate = e.target.value;
            loadChart();
        });

        // Heure début
        document.getElementById('timeStart').addEventListener('change', e => {
            state.timeStart = e.target.value !== '' ? e.target.value : null;

            // Vérification : début ne peut pas dépasser fin
            if (state.timeStart && state.timeEnd && state.timeStart > state.timeEnd) {
                state.timeEnd = null;
                document.getElementById('timeEnd').value = '';
            }
            loadChart();
        });

        // Heure fin
        document.getElementById('timeEnd').addEventListener('change', e => {
            state.timeEnd = e.target.value !== '' ? e.target.value : null;

            // Vérification : fin ne peut pas être avant début
            if (state.timeStart && state.timeEnd && state.timeEnd < state.timeStart) {
                state.timeStart = null;
                document.getElementById('timeStart').value = '';
            }
            loadChart();
        });

        // Reset plage
        document.getElementById('resetTime').addEventListener('click', () => {
            state.timeStart = null;
            state.timeEnd   = null;
            document.getElementById('timeStart').value = '';
            document.getElementById('timeEnd').value   = '';
            loadChart();
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            state.isDark = !state.isDark;
            document.getElementById('app').classList.toggle('dark', state.isDark);
            document.getElementById('themeToggle').textContent =
                state.isDark ? 'Thème clair' : 'Thème sombre';
            EnergyChart.destroy();
            loadChart();
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => Dashboard.init());