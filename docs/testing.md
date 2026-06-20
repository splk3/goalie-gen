# Testing Guide

Goalie Gen features an automated test suite using Jest and React Testing Library to verify code features, UI rendering, document generation, and static resource lists.

---

## 🛠️ Running Tests

### 1. Run the Full Test Suite

Runs all Jest tests across the repository:

```bash
npm run test
```

### 2. Run a Single Test File

To target a specific test suite, pass the relative path to the test file:

```bash
npm test -- src/components/__tests__/Pagination.test.tsx
```

### 3. Run a Specific Test by Name

To target tests matching a particular string, use the `-t` flag:

```bash
npm test -- -t "clamps out-of-range currentPage"
```

---

## 📐 Drill Page and PDF Verification

Drill pagination rules are verified using a dedicated validation script to catch layout regression errors:

- **Verification Command**:

  ```bash
  npm run verify-drills
  ```

- **What it does**: Executes `verify-drills.ts` (using `tsx`) to read the entire active drill catalogue. It parses page estimates and warns of any layouts or spacing issues that would result in drill text overflowing their PDF pages.

---

## ⚙️ Jest Configuration & Environment Setup

The repository uses custom configuration files to mock Gatsby hooks and manage typescript compilation in tests:

- **`jest.config.js`**: Specifies directories to test, maps module names, and identifies mock files.
- **`jest-preprocess.js`**: Compiles typescript and JSX assets using Babel config templates.
- **`jest.setup.js`**: Integrates `@testing-library/jest-dom` matchers and overrides standard Gatsby loader components.
- **`loadershim.js`**: Pre-configures a global loader mock to prevent Gatsby links from throwing errors during mounting operations.
- **`__mocks__/`**: Contains mock modules for asset imports (images, static files) and Gatsby hooks.
