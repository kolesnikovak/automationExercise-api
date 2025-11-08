# AutomationExercise API Testing Framework

A comprehensive TypeScript-based API testing framework for [AutomationExercise](https://automationexercise.com/api_list) using Playwright Test.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Reports](#test-reports)
- [API Coverage](#api-coverage)

## ✨ Features

- ✅ TypeScript for type safety
- ✅ Playwright Test for reliable API testing
- ✅ Modular architecture with reusable utilities
- ✅ Comprehensive test coverage for all 14 API endpoints
- ✅ Data generators for dynamic test data
- ✅ Custom assertion helpers
- ✅ HTML and JSON test reports
- ✅ Environment-based configuration
- ✅ Parallel test execution

## 📁 Project Structure

```
automationExercise-api/
├── tests/                          # Test files
│   ├── products.spec.ts           # Product API tests
│   ├── brands.spec.ts             # Brand API tests
│   ├── search.spec.ts             # Search API tests
│   ├── auth.spec.ts               # Authentication tests
│   └── account.spec.ts            # Account management tests
├── utils/                          # Utility modules
│   ├── api-client.ts              # API client wrapper
│   ├── test-data-generator.ts     # Test data generators
│   └── assertions.ts              # Custom assertions
├── types/                          # TypeScript type definitions
│   └── api.types.ts               # API response types
├── playwright.config.ts            # Playwright configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
```

## 🔧 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 📦 Installation

1. Clone the repository:
```bash
cd automationExercise-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration if needed.

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
BASE_URL=https://automationexercise.com/api
TEST_EMAIL=test@example.com
TEST_PASSWORD=Test123!
API_TIMEOUT=30000
```

### Playwright Configuration

Configuration is defined in `playwright.config.ts`. Key settings:

- **Base URL**: API base endpoint
- **Parallel execution**: Tests run in parallel
- **Reporters**: HTML, List, and JSON reporters
- **Retries**: Configurable retry logic

## 🚀 Running Tests

### Run all tests
```bash
npm test
```

### Run specific test suite
```bash
npm run test:products    # Product API tests
npm run test:brands      # Brand API tests
npm run test:search      # Search API tests
npm run test:auth        # Authentication tests
npm run test:account     # Account management tests
```

### Run tests in headed mode (with browser UI)
```bash
npm run test:headed
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Debug tests
```bash
npm run test:debug
```

### Clean test results
```bash
npm run clean
```

## 📊 Test Reports

### View HTML Report
After running tests, view the HTML report:
```bash
npm run report
```

The report will open in your default browser showing:
- Test execution summary
- Pass/fail status for each test
- Execution time
- Error details for failed tests

### Report Locations
- HTML Report: `playwright-report/index.html`
- JSON Report: `test-results/results.json`

## 🧪 API Coverage

The framework covers all 14 AutomationExercise API endpoints:

### Products
- ✅ API 1: GET All Products List
- ✅ API 2: POST To All Products List (405 validation)

### Brands
- ✅ API 3: GET All Brands List
- ✅ API 4: PUT To All Brands List (405 validation)

### Search
- ✅ API 5: POST Search Product (with parameter)
- ✅ API 6: POST Search Product (without parameter - error validation)

### Authentication
- ✅ API 7: POST Verify Login (valid credentials)
- ✅ API 8: POST Verify Login (missing email - error validation)
- ✅ API 9: DELETE Verify Login (405 validation)
- ✅ API 10: POST Verify Login (invalid credentials)

### Account Management
- ✅ API 11: POST Create/Register User Account
- ✅ API 12: DELETE User Account
- ✅ API 13: PUT Update User Account (405 validation)
- ✅ API 14: GET User Account Detail By Email

## 🛠️ Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { ApiClient } from '../utils/api-client';
import { ApiAssertions } from '../utils/assertions';

test.describe('Your Test Suite', () => {
  let apiClient: ApiClient;

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request);
  });

  test('Your test case', async () => {
    const response = await apiClient.yourMethod();
    
    await ApiAssertions.assertStatusCode(response, 200);
    
    const responseBody = await response.json();
    expect(responseBody).toBeDefined();
  });
});
```

## 🔍 Utilities

### API Client (`utils/api-client.ts`)
Wrapper class for all API endpoints with type-safe methods.

### Test Data Generator (`utils/test-data-generator.ts`)
Generates random test data for users, emails, etc.

### Assertions (`utils/assertions.ts`)
Custom assertion helpers for common validations.

## 📝 Best Practices

1. **Use the API Client**: Always use the `ApiClient` class for API calls
2. **Generate Dynamic Data**: Use `TestDataGenerator` for random test data
3. **Custom Assertions**: Leverage `ApiAssertions` for consistent validations
4. **Clean Up**: Always clean up created test data (delete test users)
5. **Descriptive Names**: Use clear, descriptive test names
6. **Test Isolation**: Each test should be independent

## 🐛 Troubleshooting

### Tests failing to run
- Ensure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be v18+)

### API timeouts
- Check internet connection
- Verify API is accessible: `https://automationexercise.com/api_list`
- Increase timeout in `.env` file

### Type errors
- Run TypeScript check: `npx tsc --noEmit`
- Ensure `@playwright/test` is installed

## 📄 License

ISC

## 👤 Author

Your Name

---

**Happy Testing! 🚀**
