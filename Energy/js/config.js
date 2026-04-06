const CONFIG = {
    API_URL: 'https://ton-api.com/api',

    PHASE_COLORS: {
        L1: '#0D5C3D',
        L2: '#1A56DB',
        L3: '#B45309'
    },

    PHASE_COLORS_DARK: {
        L1: '#2DD4A0',
        L2: '#60A5FA',
        L3: '#FCD34D'
    },

    FACTORS: [
        { key: 'energie',   label: 'Énergie',   unit: 'kWh' },
        { key: 'courant',   label: 'Courant',   unit: 'A'   },
        { key: 'puissance', label: 'Puissance', unit: 'kW'  },
        { key: 'tension',   label: 'Tension',   unit: 'V'   }
    ],

    MOCK: {
        phases: [
            { id: 'L1', label: 'Phase L1', indicators: { energie: 0.93, courant: 18.4, puissance: 4.2, tension: 231 }},
            { id: 'L2', label: 'Phase L2', indicators: { energie: 0.87, courant: 16.1, puissance: 3.8, tension: 229 }},
            { id: 'L3', label: 'Phase L3', indicators: { energie: 0.91, courant: 17.7, puissance: 4.0, tension: 230 }}
        ],
        history: {
            energie:   [0.91,0.87,0.93,0.88,0.95,0.83,0.99,1.02,0.97,0.88,0.92,0.85,0.78,0.90,0.94,0.86,1.0,0.93,0.88,0.95,0.82,0.90,0.93,0.87],
            courant:   [18,17,19,16,20,18,21,19,18,17,16,18,19,17,20,18,17,19,18,16,17,18,19,18],
            puissance: [4.1,3.8,4.3,3.6,4.5,4.0,4.7,4.4,4.2,3.9,3.7,4.1,4.3,3.8,4.6,4.0,3.9,4.2,4.1,3.7,3.8,4.0,4.3,4.1],
            tension:   [230,229,231,230,232,229,231,230,229,231,230,229,230,232,230,229,231,230,229,230,231,230,229,230]
        }
    }
};