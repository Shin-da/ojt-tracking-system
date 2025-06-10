// API Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost/OJT%20TRACKER/api'
    : 'https://ojt-tracker-five.vercel.app/api';

console.log('API_URL being used:', API_URL, 'Hostname:', window.location.hostname);

export { API_URL }; 