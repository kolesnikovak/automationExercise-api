import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config, selectUserAction, getRandomSearchTerm } from '../utils/config.js';

// Custom metrics for detailed analysis
const browseProductsRate = new Rate('browse_products_success_rate');
const searchItemsRate = new Rate('search_items_success_rate');
const checkBrandsRate = new Rate('check_brands_success_rate');
const browseProductsDuration = new Trend('browse_products_duration');
const searchItemsDuration = new Trend('search_items_duration');
const checkBrandsDuration = new Trend('check_brands_duration');
const actionCounter = new Counter('action_distribution');

// Test configuration following the lunch hour traffic pattern
export const options = {
  scenarios: {
    lunch_hour_traffic: {
      executor: 'ramping-vus',
      stages: [
        // Ramp up: 2 minutes to reach 50 concurrent users
        // Simulates gradual lunch break traffic as people start browsing
        { duration: config.scenarios.lunch_hour_traffic.rampUpDuration, target: config.scenarios.lunch_hour_traffic.rampUpTarget },
        
        // Sustain: 5 minutes at 50 concurrent users
        // Peak lunch period (12-2 PM) with steady traffic
        { duration: config.scenarios.lunch_hour_traffic.sustainDuration, target: config.scenarios.lunch_hour_traffic.sustainTarget },
        
        // Ramp down: 1 minute back to 0 users
        // People return to work, traffic decreases
        { duration: config.scenarios.lunch_hour_traffic.rampDownDuration, target: config.scenarios.lunch_hour_traffic.rampDownTarget },
      ],
      gracefulRampDown: '30s',
    },
  },
  
  // Performance thresholds - tests will fail if these are not met
  thresholds: {
    // Overall HTTP metrics
    'http_req_duration': [`p(95)<${config.thresholds.http_req_duration_p95}`, `p(99)<${config.thresholds.http_req_duration_p99}`],
    'http_req_failed': [`rate<${config.thresholds.http_req_failed_rate}`],
    
    // Individual action success rates (should be > 99%)
    'browse_products_success_rate': ['rate>0.99'],
    'search_items_success_rate': ['rate>0.99'],
    'check_brands_success_rate': ['rate>0.99'],
    
    // Individual action response times
    'browse_products_duration': ['p(95)<2000', 'p(99)<5000'],
    'search_items_duration': ['p(95)<2000', 'p(99)<5000'],
    'check_brands_duration': ['p(95)<2000', 'p(99)<5000'],
  },
  
  // Additional test settings
  noConnectionReuse: false,
  userAgent: 'K6LoadTest/1.0 (E-commerce Lunch Hour Simulation)',
};

// Main test function - executed by each virtual user
export default function () {
  // Determine what action this virtual user will perform
  // Distribution: 60% browse, 25% search, 15% brands
  const action = selectUserAction();
  
  let response;
  let success;
  
  switch (action) {
    case 'browseProducts':
      // 60% of users browse all products
      response = http.get(`${config.baseURL}/productsList`, {
        tags: { name: 'BrowseProducts' },
      });
      
      success = check(response, {
        'browse products: status is 200': (r) => r.status === 200,
        'browse products: has products data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.products !== undefined && Array.isArray(body.products);
          } catch (e) {
            return false;
          }
        },
        'browse products: response time < 2s': (r) => r.timings.duration < 2000,
      });
      
      browseProductsRate.add(success);
      browseProductsDuration.add(response.timings.duration);
      actionCounter.add(1, { action: 'browseProducts' });
      break;
      
    case 'searchItems':
      // 25% of users search for specific items
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
        'search items: status is 200': (r) => r.status === 200,
        'search items: has products data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.products !== undefined;
          } catch (e) {
            return false;
          }
        },
        'search items: response time < 2s': (r) => r.timings.duration < 2000,
      });
      
      searchItemsRate.add(success);
      searchItemsDuration.add(response.timings.duration);
      actionCounter.add(1, { action: 'searchItems' });
      break;
      
    case 'checkBrands':
      // 15% of users check available brands
      response = http.get(`${config.baseURL}/brandsList`, {
        tags: { name: 'CheckBrands' },
      });
      
      success = check(response, {
        'check brands: status is 200': (r) => r.status === 200,
        'check brands: has brands data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.brands !== undefined && Array.isArray(body.brands);
          } catch (e) {
            return false;
          }
        },
        'check brands: response time < 2s': (r) => r.timings.duration < 2000,
      });
      
      checkBrandsRate.add(success);
      checkBrandsDuration.add(response.timings.duration);
      actionCounter.add(1, { action: 'checkBrands' });
      break;
  }
  
  // Realistic user think time: 1-5 seconds between actions
  // Users don't immediately make another request
  sleep(Math.random() * 4 + 1);
}

// Setup function - runs once before the test starts
export function setup() {
  console.log('='.repeat(80));
  console.log('LOAD TEST: Lunch Hour Traffic Simulation');
  console.log('='.repeat(80));
  console.log(`Base URL: ${config.baseURL}`);
  console.log(`Test Duration: ${config.scenarios.lunch_hour_traffic.totalDuration} (2m ramp-up, 5m sustain, 1m ramp-down)`);
  console.log(`Peak Concurrent Users: ${config.scenarios.lunch_hour_traffic.sustainTarget}`);
  console.log(`Max System Capacity: ${config.maxCapacity.users} users`);
  console.log('');
  console.log('User Behavior Distribution:');
  console.log(`  - Browsing Products: ${config.userBehavior.browsingProducts}%`);
  console.log(`  - Searching Items: ${config.userBehavior.searchingItems}%`);
  console.log(`  - Checking Brands: ${config.userBehavior.checkingBrands}%`);
  console.log('');
  console.log('Performance Thresholds:');
  console.log(`  - 95th percentile: < ${config.thresholds.http_req_duration_p95}ms`);
  console.log(`  - 99th percentile: < ${config.thresholds.http_req_duration_p99}ms`);
  console.log(`  - Success rate: > ${config.thresholds.http_req_success_rate * 100}%`);
  console.log('='.repeat(80));
  console.log('');
}

// Teardown function - runs once after the test completes
export function teardown(data) {
  console.log('');
  console.log('='.repeat(80));
  console.log('LOAD TEST COMPLETED');
  console.log('Check the summary above for detailed metrics and threshold results');
  console.log('='.repeat(80));
}
