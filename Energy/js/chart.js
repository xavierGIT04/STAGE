const EnergyChart = (() => {
    let chart = null;

    function render(histories, factor, phases, isDark) {
        const canvas    = document.getElementById('mainChart');
        const colors    = isDark ? CONFIG.PHASE_COLORS_DARK : CONFIG.PHASE_COLORS;
        const unit      = CONFIG.FACTORS.find(f => f.key === factor)?.unit ?? '';
        const isSingle  = histories[0]?.data.length === 1;

        const gridColor     = isDark ? '#1E2A3A' : '#F0F2F5';
        const tickColor     = isDark ? '#8899AA' : '#667085';
        const tooltipBg     = isDark ? '#111820' : '#FFFFFF';
        const tooltipBorder = isDark ? '#243040' : '#E2E6EA';
        const tooltipTitle  = isDark ? '#8899AA' : '#667085';
        const tooltipBody   = isDark ? '#F0F4F8' : '#0D1B2A';

        if (chart) { chart.destroy(); chart = null; }

        // Un dataset par phase sélectionnée
        const datasets = histories.map((history, i) => {
            const phase = phases[i];
            const color = colors[phase];
            return {
                label: `Phase ${phase}`,
                data: history.data.map(d => d.value),
                borderColor: color,
                backgroundColor: isSingle ? color + 'CC' : color + '15',
                tension: 0.4,
                pointRadius: isSingle ? 0 : 3,
                pointHoverRadius: 5,
                pointBackgroundColor: color,
                borderWidth: 2,
                fill: false,        // pas de remplissage quand superposé
                barThickness: isSingle ? 60 : undefined
            };
        });

        // Labels depuis la première phase (toutes ont les mêmes heures)
        const labels = histories[0]?.data.map(d => d.time) ?? [];

        chart = new Chart(canvas, {
            type: isSingle ? 'bar' : 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400, easing: 'easeInOutQuart' },
                plugins: {
                    legend: {
                        // Afficher la légende seulement si plusieurs phases
                        display: phases.length > 1,
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: tickColor,
                            font: { size: 12, family: 'Inter' },
                            boxWidth: 12,
                            boxHeight: 12,
                            borderRadius: 3,
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        titleColor: tooltipTitle,
                        bodyColor: tooltipBody,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y} ${unit}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: tickColor, font: { size: 12, family: 'Inter' } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: tickColor,
                            font: { size: 12, family: 'Inter' },
                            callback: v => `${v} ${unit}`
                        }
                    }
                }
            }
        });
    }

    function destroy() {
        if (chart) { chart.destroy(); chart = null; }
    }

    return { render, destroy };
})();