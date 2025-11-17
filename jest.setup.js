/* eslint-disable @typescript-eslint/no-require-imports */
// Load environment variables from .env.local for tests
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
