import { fetchAempsAlerts } from './src/cron/aempsScraper.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function dump() {
    const alerts = await fetchAempsAlerts('inicial');
    for (const a of alerts) {
        if (a.title.includes('FOSFATO BIVALENTE')) {
            console.log("Found Target Alert!");
            console.log("------ TITLE:", a.title);
            console.log("------ URL:", a.link);
            console.log("------ TXT:", a.fullText.substring(0, 1000));
        }
    }
}
dump();
