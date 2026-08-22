import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({

    testDir: './tests',

    timeout: 120000,

    expect: {
        timeout: 10000
    },

    fullyParallel: false,

    // One worker at a time. Every spec logs in as the same admin account, and
    // running spec files concurrently makes those logins collide - the login
    // page stalls or never reaches /home. Serialising keeps the suite green
    // until shared authentication (storageState) is introduced.
    workers: 1,

    retries: process.env.CI ? 2 : 0,

    reporter: [
        ['list'],
        ['html']
    ],

    use: {
        baseURL: process.env.BASE_URL,

        headless: false,

        // --start-maximized opens the browser window maximised to the screen.
        launchOptions: {
            args: ['--start-maximized']
        },

        screenshot: 'only-on-failure',

        video: 'retain-on-failure',

        trace: 'retain-on-failure',

        actionTimeout: 15000,

        navigationTimeout: 30000
    },

    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',

                // viewport: null means "use the real browser window size"
                // instead of Playwright's fixed 1280x720 box. Combined with
                // --start-maximized above, the run fills the whole screen.
                //
                // Note: devices['Desktop Chrome'] is deliberately NOT spread in
                // here. It hard-sets viewport 1280x720, deviceScaleFactor and
                // screen, all of which either override or conflict with
                // viewport: null -- which is exactly what kept the window small.
                viewport: null
            }
        }
    ]
});
