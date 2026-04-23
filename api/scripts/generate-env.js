#!/usr/bin/env node

/**
 * Generate secure environment variables for Joinly production deployment
 * Run with: node scripts/generate-env.js
 */

import crypto from "crypto";

function generateSecurePassword(length = 16) {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
	let password = "";

	// Ensure at least one of each required character type
	password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
	password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
	password += "0123456789"[Math.floor(Math.random() * 10)]; // number
	password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special

	// Fill remaining length
	for (let i = 4; i < length; i++) {
		password += chars[Math.floor(Math.random() * chars.length)];
	}

	// Shuffle the password
	return password
		.split("")
		.sort(() => Math.random() - 0.5)
		.join("");
}

function generateJWTSecret() {
	return crypto.randomBytes(32).toString("base64");
}

console.log("🔐 Joinly Production Environment Variables Generator\n");
console.log("Copy these values to your Railway environment variables:\n");

console.log("━━━ Security Configuration ━━━");
console.log(`JWT_SECRET=${generateJWTSecret()}`);
console.log("JWT_EXPIRES_IN=24h");
console.log("RATE_LIMIT_ENABLED=true");
console.log("ACL_ENABLED=true");
console.log("NODE_ENV=production");
console.log();

console.log("━━━ Seed User Passwords ━━━");
console.log(`SEED_TESTUSER_1_PASSWORD=${generateSecurePassword()}`);
console.log(`SEED_TESTUSER_2_PASSWORD=${generateSecurePassword()}`);
console.log(`SEED_ADMIN_1_PASSWORD=${generateSecurePassword()}`);
console.log();

console.log("⚠️  IMPORTANT SECURITY NOTES:");
console.log("1. Store these values securely - do NOT commit them to git");
console.log("2. Use Railway dashboard or CLI to set environment variables");
console.log("3. Keep the JWT_SECRET private and never expose it");
console.log("4. Save the seed passwords - you'll need them for initial login");
console.log("5. Consider using a password manager for production credentials");
console.log();

console.log("📚 For deployment instructions, see DEPLOYMENT.md");
