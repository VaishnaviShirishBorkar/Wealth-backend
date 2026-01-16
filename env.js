import dotenv from "dotenv";

/**
 * Load .env ONLY in local development.
 * Render / production already injects env vars.
 */
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
  console.log("✅ Local .env loaded");
} else {
  console.log("✅ Using Render environment variables");
}
