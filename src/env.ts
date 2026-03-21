// This module must be the first import in any entry point that needs .env loaded.
// ES module imports are hoisted and evaluated before any code runs, so we can't
// call process.loadEnvFile() inline and have it take effect before other imports.
// Importing this file first ensures .env is loaded before any other module reads env vars.
try { process.loadEnvFile() } catch {}
