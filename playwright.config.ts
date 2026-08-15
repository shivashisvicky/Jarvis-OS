import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ testDir:'./tests/e2e', use:{...devices['Desktop Chrome'], baseURL:'http://127.0.0.1:4173'}, webServer:{command:'npm run dev -- --host 127.0.0.1', port:5173, reuseExistingServer:true}, reporter:'list'});
