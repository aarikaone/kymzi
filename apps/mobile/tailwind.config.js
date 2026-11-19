/** @type {import('tailwindcss').Config} */
module.exports = {
 content: ['./App.tsx', './components/**/*.{js,jsx,ts,tsx}'],
 presets: [require('nativewind/preset')],
 theme: {extend: {colors: {lime:'#D5F88F',lavender:'#D5F88F',game:'#090C0A',brand:'#D5F88F',bluewash:'#243026',paper:'#090C0A',surface:'#151B16',ink:'#F1F5EB',muted:'#B1BCA8',line:'#3E5140'}}},
 plugins: [],
};
