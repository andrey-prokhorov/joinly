## Code Review Instructions

### Language & Comments
- When code comments are written in Swedish - do NOT flag language choice or suggest English
- Do NOT comment on spelling errors in code comments (// kommentarer)
- Do NOT suggest rephrasing comments unless the comment is factually wrong about what the code does

### Focus Areas (prioritize these)
- Security vulnerabilities (XSS, injection, auth bypass, secrets in code)
- Logic bugs and incorrect behavior
- Missing error handling for database operations
- Race conditions or async issues
- Type safety issues

### Lower Priority (only flag if severe)
- Code style and formatting (we use Biome for this)
- Naming conventions (only flag if genuinely misleading)
- Performance optimizations (only flag if clearly O(n^2) or worse)

### Project Context
- This is a school project (DevSecOps course) using TypeScript, Express 5, SQLite
- We use Biome for linting/formatting - do not suggest ESLint/Prettier rules
- Swedish comments are intentional and part of our code style
- Seed data with test credentials is expected in development mode