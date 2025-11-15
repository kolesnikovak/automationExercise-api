import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { config, selectUserAction, getRandomSearchTerm } from '../utils/config.js';

// Custom metrics
const apiHealthRate = new Rate('api_health_rate');

// Smoke test configuration - minimal load for quick validation
export const options = {
  scenarios: {
    smoke_test: {
      executor: 'constant-vus',
      vus: 3,           // Only 3 virtual users
      duration: '1m',   // Run for just 1 minute
    },
  },
  
  // Relaxed thresholds for smoke test - just checking if APIs are working
  thresholds: {
    'http_req_duration': ['p(95)<3000'],  // 95% under 3 seconds
    'http_req_failed': ['rate<0.05'],     // Less than 5% errors
    'api_health_rate': ['rate>0.95'],     // At least 95% success
  },
};

// Smoke test function - validates each API endpoint works correctly
export default function () {
  const action = selectUserAction();
  
  let response;
  let success = false;
  
  switch (action) {
    case 'browseProducts':
      response = http.get(`${config.baseURL}/productsList`, {
        tags: { name: 'BrowseProducts' },
      });
      
      success = check(response, {
        'browse products works': (r) => r.status === 200,
        'browse products has data': (r) => {
          try {
            return JSON.parse(r.body).products !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
      break;
      
    case 'searchItems':
      const searchTerm = getRandomSearchTerm();
      response = http.post(
        `${config.baseURL}/searchProduct`,
        { search_product: searchTerm },
        {
          tags: { name: 'SearchItems' },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      
      success = check(response, {
        'search items works': (r) => r.status === 200,
        'search items has data': (r) => {
          try {
            return JSON.parse(r.body).products !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
      break;
      
    case 'checkBrands':
      response = http.get(`${config.baseURL}/brandsList`, {
        tags: { name: 'CheckBrands' },
      });
      
      success = check(response, {
        'check brands works': (r) => r.status === 200,
        'check brands has data': (r) => {
          try {
            return JSON.parse(r.body).brands !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
      break;
  }
  
  apiHealthRate.add(success);
  
  // Longer sleep time in smoke test
  sleep(2);
}

export function setup() {
  console.log('='.repeat(80));
  console.log('SMOKE TEST: Quick API Health Check');
  console.log('='.repeat(80));
  console.log(`Base URL: ${config.baseURL}`);
  console.log(`Virtual Users: 3`);
  console.log(`Duration: 1 minute`);
  console.log('');
  console.log('Purpose: Validate all API endpoints are functional before load testing');
  console.log('Testing endpoints:');
  console.log('  - GET /productsList (Browse Products)');
  console.log('  - POST /searchProduct (Search Items)');
  console.log('  - GET /brandsList (Check Brands)');
  console.log('='.repeat(80));
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('='.repeat(80));
  console.log('SMOKE TEST COMPLETED');
  console.log('If all checks passed, you can proceed with the full load test');
  console.log('='.repeat(80));
}
