import forms from '@tailwindcss/forms';
export default { content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], theme: { extend: { colors: { ink: '#172033', brand: { 50:'#eef4ff',100:'#dce8ff',500:'#4778ed',600:'#315fce',700:'#274da8' } }, boxShadow: { soft: '0 10px 30px rgba(15, 23, 42, .06)' } } }, plugins: [forms] };
