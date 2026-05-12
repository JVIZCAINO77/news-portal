require('dotenv').config({ path: '.env.local' });

// We need to fetch the local API if we want it to run using the local next.js server, 
// but since we want to run the bot without starting a server, we can just use the Vercel CLI.
