# T023: Environment Configuration - Learning Guide

**Topic**: Environment Variables and Configuration Management
**Difficulty**: Beginner to Intermediate
**Technologies**: .env files, dotenv, Docker environment variables, Vite environment variables
**Related Tasks**: H006 (Documentation), H005 (Docker Compose), H012 (Database)

---

## Table of Contents

1. [What are Environment Variables?](#what-are-environment-variables)
2. [Why Use Environment Variables?](#why-use-environment-variables)
3. [The .env File](#the-env-file)
4. [.env.example Files](#envexample-files)
5. [Using dotenv in Node.js](#using-dotenv-in-nodejs)
6. [Vite Environment Variables](#vite-environment-variables)
7. [Docker Environment Variables](#docker-environment-variables)
8. [Security Best Practices](#security-best-practices)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Topics](#advanced-topics)

---

## What are Environment Variables?

Environment variables are **dynamic values** that can affect the behavior of running processes on a computer. They exist at the operating system level and can be accessed by programs.

### Example: System Environment Variables

```bash
# Linux/macOS
echo $HOME        # /home/username
echo $PATH        # /usr/local/bin:/usr/bin:/bin
echo $USER        # username

# Windows
echo %USERPROFILE%  # C:\Users\username
echo %PATH%         # C:\Windows\System32;...
```

### Why Operating System Environment Variables?

1. **Configuration Without Code Changes**: Change behavior without recompiling
2. **Platform Independence**: Different values on different systems
3. **Security**: Keep secrets out of source code
4. **Convenience**: One place to configure multiple programs

---

## Why Use Environment Variables?

### 1. Separate Configuration from Code

**Bad Practice** (hardcoded):
```typescript
const DATABASE_URL = 'postgresql://user:password@localhost:5432/mydb';
const API_KEY = 'sk-ant-api03-1234567890';  // ❌ EXPOSED IN SOURCE CODE
```

**Good Practice** (environment variables):
```typescript
const DATABASE_URL = process.env.DATABASE_URL;
const API_KEY = process.env.ANTHROPIC_API_KEY;  // ✅ SECRET NOT IN CODE
```

### 2. Different Configurations for Different Environments

```bash
# Development
DATABASE_URL=postgresql://localhost:5432/dev_db

# Staging
DATABASE_URL=postgresql://staging.example.com:5432/staging_db

# Production
DATABASE_URL=postgresql://prod.example.com:5432/prod_db
```

Same code, different behavior based on environment variables.

### 3. Security (12-Factor App Principle)

The [12-Factor App](https://12factor.net/config) methodology states:
> **Store config in the environment**

**Why?**
- ❌ Config files might be accidentally committed to git
- ❌ Source code is often shared publicly (GitHub, npm packages)
- ✅ Environment variables are **never** checked into source control
- ✅ Different values for different deployments (dev vs prod)

### 4. Easy Deployment

Change configuration without changing code:

```bash
# Deploy to different region
export AWS_REGION=us-west-2

# Deploy to different stage
export NODE_ENV=production

# Use different database
export DATABASE_URL=postgresql://new-db.example.com:5432/db
```

No code changes, just environment variables.

---

## The .env File

### What is a .env File?

A `.env` file is a **text file** containing **key-value pairs** of environment variables.

**Example .env file**:
```bash
# Server configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-your-real-key-here
```

### How .env Files Work

1. **Developer creates** `.env` file locally (never commit this!)
2. **Application loads** `.env` file using `dotenv` library
3. **Variables become available** via `process.env.VARIABLE_NAME`

### .env File Syntax

```bash
# Comments start with #

# Simple key-value pairs
KEY=value
ANOTHER_KEY=another value

# No need for quotes (usually)
DATABASE_URL=postgresql://localhost:5432/db

# Quotes preserve spaces and special characters
MESSAGE="Hello, World!"
SPECIAL='Value with $pecial characters'

# Multi-line values (use backslash)
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n\
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n\
-----END PRIVATE KEY-----"

# Variable expansion (depends on dotenv library)
BASE_URL=https://api.example.com
API_URL=${BASE_URL}/v1  # May or may not work
```

### .env File Location

**Common locations**:
- **Monorepo root**: `/project-root/.env` (for Docker Compose)
- **Service-specific**: `/backend/.env`, `/frontend/.env`

**Our project structure**:
```
/home/user/hackathon_BI_CKD/
├── .env                 # For Docker Compose (create from .env.example)
├── backend/
│   └── .env             # Optional: for local backend development
└── frontend/
    └── .env             # Optional: for local frontend development
```

---

## .env.example Files

### What is a .env.example File?

A `.env.example` file is a **template** showing what environment variables your application needs.

**Purpose**:
1. ✅ **Can be committed** to git (no secrets)
2. ✅ Documents required environment variables
3. ✅ Shows example/default values
4. ✅ Helps new developers get started

### .env vs .env.example

| File | Purpose | Contains Secrets? | Committed to Git? |
|------|---------|------------------|-------------------|
| `.env` | Actual configuration | ✅ YES (API keys, passwords) | ❌ NO (in .gitignore) |
| `.env.example` | Template/Documentation | ❌ NO (placeholder values) | ✅ YES (checked in) |

### How to Use .env.example

**Developer workflow**:
```bash
# 1. Clone repository
git clone https://github.com/user/project.git

# 2. Copy .env.example to .env
cp .env.example .env

# 3. Edit .env with real values
nano .env  # Add real API key: ANTHROPIC_API_KEY=sk-ant-api03-real-key

# 4. Never commit .env
git status  # .env should NOT appear (it's in .gitignore)
```

### Example .env.example File

```bash
# ==========================================
# Backend Environment Variables - TEMPLATE
# ==========================================

# ==========================================
# Server Configuration
# ==========================================

# Node environment (development, production, test)
NODE_ENV=development

# Server port (default: 3000)
PORT=3000

# ==========================================
# Database Configuration
# ==========================================

# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://healthcare_user:healthcare_pass@localhost:5432/healthcare_ai_db

# ==========================================
# AI Service Configuration
# ==========================================

# Anthropic API Key (Claude AI)
# Get your key from: https://console.anthropic.com
# REQUIRED for AI risk analysis features
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
#                  ^^^^^^^^^^^^^^^^^^^^^^^^^ REPLACE WITH REAL KEY

# ==========================================
# Instructions
# ==========================================

# 1. Copy this file to .env:
#    cp .env.example .env
#
# 2. Update ANTHROPIC_API_KEY with your actual API key
#
# 3. Never commit .env to git

# ==========================================
# Security Notes
# ==========================================

# - Never commit .env file to version control
# - Never share your .env file with others
# - Rotate API keys regularly
```

**Key Features**:
1. **Section headers** (clear organization)
2. **Comments** (explain each variable)
3. **Placeholder values** (no real secrets)
4. **Instructions** (how to use)
5. **Security notes** (best practices)

---

## Using dotenv in Node.js

### Installation

```bash
npm install dotenv
```

### Basic Usage

**Load .env file at application startup**:

```typescript
import dotenv from 'dotenv';

// Load .env file from current directory
dotenv.config();

// Now use environment variables
const port = process.env.PORT || 3000;
const apiKey = process.env.ANTHROPIC_API_KEY;

console.log(`Server starting on port ${port}`);
```

### Advanced dotenv Usage

**Specify .env file path**:
```typescript
import dotenv from 'dotenv';
import path from 'path';

// Load .env from specific path
dotenv.config({ path: path.resolve(__dirname, '../.env') });
```

**Multiple .env files**:
```typescript
// Load base configuration
dotenv.config({ path: '.env' });

// Override with environment-specific config
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Possible files:
// .env              (base config)
// .env.development  (development overrides)
// .env.production   (production overrides)
// .env.test         (test overrides)
```

**Error handling**:
```typescript
const result = dotenv.config();

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}
```

### Accessing Environment Variables

```typescript
// Direct access (may be undefined)
const apiKey = process.env.ANTHROPIC_API_KEY;

// With default value
const port = process.env.PORT || 3000;

// Parse numbers
const maxConnections = parseInt(process.env.DB_POOL_MAX || '10', 10);

// Parse booleans
const isDebug = process.env.DEBUG === 'true';

// Required variables (throw error if missing)
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const apiKey = getEnvVar('ANTHROPIC_API_KEY');
```

---

## Vite Environment Variables

### Vite's Special VITE_ Prefix

**Vite only exposes variables prefixed with `VITE_` to the browser.**

**Why?** Security! Prevent accidentally exposing secrets to the browser.

### Frontend .env File

```bash
# ✅ EXPOSED to browser (VITE_ prefix)
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=Healthcare AI
VITE_DEBUG=false

# ❌ NOT exposed to browser (no VITE_ prefix)
NODE_ENV=development
SECRET_KEY=should-not-be-public
```

### Accessing VITE_ Variables

**In React components**:
```typescript
// ✅ Works - VITE_ prefix
const apiUrl = import.meta.env.VITE_API_URL;
console.log(apiUrl);  // http://localhost:3000

// ❌ Undefined - no VITE_ prefix
const secret = import.meta.env.SECRET_KEY;
console.log(secret);  // undefined

// Built-in Vite variables
console.log(import.meta.env.MODE);  // 'development' or 'production'
console.log(import.meta.env.DEV);   // true in development
console.log(import.meta.env.PROD);  // true in production
```

### Environment-Specific .env Files (Vite)

Vite loads .env files in this order (later files override earlier):

```
.env                # Base config (all environments)
.env.local          # Local overrides (gitignored)
.env.[mode]         # Mode-specific (.env.development, .env.production)
.env.[mode].local   # Mode-specific local overrides (gitignored)
```

**Example**:
```bash
# .env (committed to git)
VITE_API_URL=https://api.production.com

# .env.development (committed to git)
VITE_API_URL=http://localhost:3000
VITE_DEBUG=true

# .env.local (NOT committed, developer-specific)
VITE_API_URL=http://192.168.1.100:3000
```

**Start dev server**:
```bash
npm run dev  # Uses .env.development + .env.local
```

**Build for production**:
```bash
npm run build  # Uses .env.production + .env.local
```

### Vite Security Warning

```typescript
// ❌ NEVER DO THIS
// VITE_ variables are PUBLIC in the browser!
VITE_ANTHROPIC_API_KEY=sk-ant-api03-secret-key

// Anyone can open DevTools and see:
console.log(import.meta.env.VITE_ANTHROPIC_API_KEY);
// Or view source: const key = "sk-ant-api03-secret-key"
```

**Rule**: **NEVER** put secrets (API keys, passwords) in VITE_ variables.

**Correct approach**:
1. API keys in backend .env (not exposed)
2. Frontend calls backend API
3. Backend uses API key server-side

---

## Docker Environment Variables

### Three Ways to Set Docker Environment Variables

#### 1. Hardcoded in docker-compose.yml

```yaml
services:
  backend:
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
```

**Pros**: Simple, self-contained
**Cons**: Not flexible, requires editing docker-compose.yml

#### 2. Injected from Host .env File

```yaml
services:
  backend:
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}  # From host .env
```

**Host .env file**:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-real-key
```

**Pros**: Secrets not in docker-compose.yml
**Cons**: Requires .env file on host

#### 3. Load .env File Inside Container

```yaml
services:
  backend:
    env_file:
      - .env  # Load entire .env file into container
```

**Pros**: Easy to manage many variables
**Cons**: Harder to override specific variables

### Docker Compose Environment Variable Precedence

**Highest to lowest priority**:
1. `docker-compose run -e VAR=value`  (command-line)
2. `environment:` in docker-compose.yml
3. `env_file:` in docker-compose.yml
4. `.env` file in project root
5. Dockerfile `ENV` instruction
6. Container's default environment

### Our Project's Approach

**docker-compose.yml**:
```yaml
services:
  backend:
    environment:
      NODE_ENV: production  # Hardcoded (container-specific)
      DB_HOST: postgres     # Hardcoded (docker service name)
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}  # Injected from host .env
```

**Why this approach?**
- Container-specific values (DB_HOST=postgres) are hardcoded
- Host-specific secrets (ANTHROPIC_API_KEY) are injected
- Best of both: simple + secure

### Docker Secret Management (Production)

For production, use Docker Secrets instead of environment variables:

```yaml
# docker-compose.prod.yml
services:
  backend:
    secrets:
      - anthropic_api_key
    environment:
      ANTHROPIC_API_KEY_FILE: /run/secrets/anthropic_api_key

secrets:
  anthropic_api_key:
    external: true
```

**Create secret**:
```bash
echo "sk-ant-api03-real-key" | docker secret create anthropic_api_key -
```

**Benefits**:
- Encrypted at rest
- Only available to specified services
- Never stored in environment variables (more secure)

---

## Security Best Practices

### 1. Never Commit .env Files

**.gitignore**:
```bash
# Environment files
.env
.env.local
.env.*.local

# Keep .env.example (it's safe to commit)
!.env.example
```

**Verify**:
```bash
git status  # .env should NOT appear
git check-ignore .env  # Should print: .env
```

### 2. Use Different Keys for Different Environments

```bash
# Development
ANTHROPIC_API_KEY=sk-ant-api03-dev-key-1234567890

# Production
ANTHROPIC_API_KEY=sk-ant-api03-prod-key-0987654321
```

**Why?**
- Limit damage if dev key is compromised
- Separate billing/usage tracking
- Easy to rotate one without affecting the other

### 3. Rotate API Keys Regularly

**Best practice**: Rotate API keys every 90 days

```bash
# Generate new key at https://console.anthropic.com
# Update .env
ANTHROPIC_API_KEY=sk-ant-api03-new-key

# Restart application
docker-compose restart backend

# Revoke old key in Anthropic console
```

### 4. Never Share .env Files

```bash
# ❌ BAD
"Hey, can you send me your .env file?"

# ✅ GOOD
"Copy .env.example to .env and add your own API key from https://console.anthropic.com"
```

### 5. Use Secret Scanning

**GitHub Secret Scanning**: Automatically detects committed secrets

**Pre-commit hook** (prevent accidental commits):
```bash
# .git/hooks/pre-commit
#!/bin/bash

if git diff --cached --name-only | grep -E '\.env$'; then
  echo "Error: Attempting to commit .env file!"
  exit 1
fi
```

**Make executable**:
```bash
chmod +x .git/hooks/pre-commit
```

### 6. Principle of Least Privilege

Only give services the environment variables they need:

```yaml
# ❌ BAD: Frontend gets API key (even though it can't use it)
frontend:
  environment:
    ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}

# ✅ GOOD: Only backend gets API key
backend:
  environment:
    ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
```

### 7. Validate Required Variables

```typescript
// Fail fast if required variables missing
const requiredEnvVars = [
  'ANTHROPIC_API_KEY',
  'DATABASE_URL',
  'DB_HOST'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    console.error('Please copy .env.example to .env and fill in values');
    process.exit(1);
  }
}
```

---

## Common Patterns

### Pattern 1: Defaults with Environment Variables

```typescript
const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'mydb',
  }
};
```

### Pattern 2: Configuration Object

```typescript
// config/database.ts
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'healthcare_db',
  user: process.env.DB_USER || 'healthcare_user',
  password: process.env.DB_PASSWORD || 'healthcare_password',
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
};
```

### Pattern 3: Environment-Specific Behavior

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

if (isDevelopment) {
  // Enable verbose logging
  app.use(morgan('dev'));
}

if (isProduction) {
  // Enable compression
  app.use(compression());
}
```

### Pattern 4: Type-Safe Environment Variables (TypeScript)

```typescript
// types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DATABASE_URL: string;
      ANTHROPIC_API_KEY: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
    }
  }
}

export {};
```

Now TypeScript autocompletes environment variables:
```typescript
const apiKey = process.env.ANTHROPIC_API_KEY;  // TypeScript knows it's string
```

---

## Troubleshooting

### Problem 1: Environment Variable Not Loading

**Symptoms**:
```typescript
console.log(process.env.MY_VAR);  // undefined
```

**Checklist**:
1. ✅ Is `dotenv.config()` called **before** using variables?
2. ✅ Is .env file in the correct location?
3. ✅ Is variable name spelled correctly?
4. ✅ Did you restart the server after changing .env?

**Solution**:
```typescript
import dotenv from 'dotenv';

// Load .env FIRST
dotenv.config();

// Then use variables
const myVar = process.env.MY_VAR;
```

### Problem 2: Vite Variable Undefined

**Symptoms**:
```typescript
console.log(import.meta.env.API_URL);  // undefined
```

**Cause**: Missing `VITE_` prefix

**Solution**:
```bash
# ❌ Wrong
API_URL=http://localhost:3000

# ✅ Correct
VITE_API_URL=http://localhost:3000
```

### Problem 3: Docker Container Not Getting Variables

**Symptoms**:
Container logs show missing environment variables

**Checklist**:
1. ✅ Is .env file in same directory as docker-compose.yml?
2. ✅ Is variable injected in docker-compose.yml?
3. ✅ Did you rebuild container after changes?

**Solution**:
```bash
# Rebuild and restart
docker-compose down
docker-compose up --build -d

# Check environment inside container
docker-compose exec backend env | grep ANTHROPIC_API_KEY
```

### Problem 4: .env File Accidentally Committed

**Symptoms**:
```bash
git status
# Changes to be committed:
#   new file:   .env
```

**Solution**:
```bash
# Remove from staging
git reset .env

# Add to .gitignore if not already there
echo ".env" >> .gitignore

# If already committed, remove from history
git rm --cached .env
git commit -m "Remove .env from version control"

# Rotate all secrets in .env immediately!
```

---

## Advanced Topics

### 1. Environment Variable Expansion

Some systems support variable expansion:

```bash
BASE_URL=https://api.example.com
API_URL=${BASE_URL}/v1

# API_URL becomes: https://api.example.com/v1
```

**Note**: Not all dotenv libraries support this. Test before relying on it.

### 2. Multi-Environment Setup

```bash
# .env.development
NODE_ENV=development
API_URL=http://localhost:3000
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
API_URL=https://api.production.com
LOG_LEVEL=error

# .env.test
NODE_ENV=test
API_URL=http://localhost:3001
LOG_LEVEL=silent
```

**Load environment-specific file**:
```typescript
import dotenv from 'dotenv';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });
```

### 3. Encrypted .env Files

For shared development teams, encrypt .env files:

```bash
# Encrypt .env
gpg --symmetric --cipher-algo AES256 .env
# Creates .env.gpg (safe to commit)

# Decrypt .env
gpg --decrypt .env.gpg > .env
```

Or use tools like:
- **git-crypt**: Transparent encryption
- **sops**: Secrets management
- **Vault**: HashiCorp Vault integration

### 4. Environment Variable Validation

**Using zod**:
```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
});

const env = envSchema.parse(process.env);

// Now env is type-safe and validated
console.log(env.PORT);  // number
console.log(env.NODE_ENV);  // 'development' | 'production' | 'test'
```

---

## Summary

### Key Takeaways

1. **Environment variables** separate configuration from code
2. **.env files** store environment variables locally
3. **.env.example files** document required variables (safe to commit)
4. **dotenv** library loads .env files in Node.js
5. **Vite VITE_ prefix** exposes variables to browser (use carefully!)
6. **Docker** has multiple ways to set environment variables
7. **Never commit .env files** (use .gitignore)
8. **Rotate API keys** regularly (every 90 days)
9. **Use different keys** for dev/staging/production
10. **Validate required variables** on application startup

### Checklist for New Projects

- [ ] Create `.env.example` with all required variables
- [ ] Add `.env` to `.gitignore`
- [ ] Document each variable's purpose
- [ ] Include setup instructions in `.env.example`
- [ ] Add security notes
- [ ] Use VITE_ prefix for frontend variables (Vite projects)
- [ ] Configure Docker Compose to inject secrets
- [ ] Add environment variable validation
- [ ] Set up secret rotation process
- [ ] Enable secret scanning (GitHub, GitLab)

---

## Resources

### Documentation
- [The Twelve-Factor App: Config](https://12factor.net/config)
- [dotenv documentation](https://github.com/motdotla/dotenv)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)

### Tools
- [dotenv](https://www.npmjs.com/package/dotenv) - Load .env files
- [dotenv-expand](https://www.npmjs.com/package/dotenv-expand) - Variable expansion
- [zod](https://zod.dev/) - Environment variable validation
- [git-crypt](https://github.com/AGWA/git-crypt) - Encrypt secrets in git

### Security
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [truffleHog](https://github.com/trufflesecurity/trufflehog) - Find secrets in git history
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Guide Author**: Healthcare AI Project Team
**Last Updated**: 2025-11-08
**Related Tasks**: H006, H023, H005, H012
