import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { config, getRandomSearchTerm } from '../utils/config.js';

// ============================================================================
// STRESS TEST: Prime Day / Cyber Monday Preparation
// ============================================================================
// Purpose: Find your breaking point BEFORE the big event
// 
// Scenario based on real-world requirements:
// - Last year's Prime Day: 150 concurrent users peak
// - This year's expectation: 200+ concurrent users
// - Need to know: Can we handle it? What breaks first?
// ============================================================================

// Custom metrics for detailed stress analysis
const browseProductsRate = new Rate('browse_products_success_rate');
const searchItemsRate = new Rate('search_items_success_rate');
const browseProductsDuration = new Trend('browse_products_duration');
const searchItemsDuration = new Trend('search_items_duration');
const actionCounter = new Counter('action_distribution');
const currentVUs = new Gauge('current_virtual_users');

// Metrics to identify breaking points
const slowResponsesCounter = new Counter('slow_responses_over_3s');
const verySlowResponsesCounter = new Counter('very_slow_responses_over_5s');
const errorsByStage = new Counter('errors_by_stage');

// Test configuration - Prime Day stress scenario
export const options = {
  scenarios: {
    prime_day_stress: {
      executor: 'ramping-vus',
      stages: [
        // Stage 1: Start at comfortable zone (last year's known capacity)
        // 100 users - this should work fine based on last year
        { duration: config.stressScenarios.prime_day.rampUpDuration, target: config.stressScenarios.prime_day.startUsers },
        
        // Stage 2: Push to expected peak (this year's target)
        // 200 users - will the system handle it?
        { duration: config.stressScenarios.prime_day.rampUpDuration, target: config.stressScenarios.prime_day.targetUsers },
        
        // Stage 3: CRITICAL - Hold at 200 users for 3 minutes
        // This is where we find breaking points:
        // - When do response times exceed 3 seconds?
        // - When do error rates spike above 1%?
        // - What fails first: database, API server, memory?
        { duration: config.stressScenarios.prime_day.sustainDuration, target: config.stressScenarios.prime_day.targetUsers },
        
        // Stage 4: Ramp down to allow system recovery observation
        { duration: config.stressScenarios.prime_day.rampDownDuration, target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  
  // Critical thresholds for stress testing - These WILL fail to show breaking points
  thresholds: {
    // Overall HTTP metrics
    'http_req_duration': [
      'p(95)<3000',  // CRITICAL: 95% should be under 3s
      'p(99)<5000',  // WARNING: 99% should be under 5s
    ],
    
    // Error rate threshold - expect this to potentially fail
    'http_req_failed': ['rate<0.01'],  // Less than 1% errors
    
    // Individual endpoint success rates
    'browse_products_success_rate': ['rate>0.99'],
    'search_items_success_rate': ['rate>0.99'],
    
    // Breaking point indicators
    'slow_responses_over_3s': ['count<100'],  // How many requests exceed 3s?
    'very_slow_responses_over_5s': ['count<50'],  // How many exceed 5s?
  },
  
  // System resource monitoring hints
  summaryTrendStats: ['min', 'avg', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)'],
};

// Helper function to determine user action
// For stress test: 70% browse (API 1), 30% search (POST Search)
function selectStressAction() {
  const random = Math.random() * 100;
  
  if (random < config.stressUserBehavior.browsingProducts) {
    return 'browseProducts';  // 70% - API 1: GET All Products
  } else {
    return 'searchItems';      // 30% - POST Search Product
  }
}

// Main test function - executed by each virtual user
export default function () {
  // Track current load level
  currentVUs.add(__VU);
  
  // Determine action based on stress test distribution (70/30)
  const action = selectStressAction();
  
  let response;
  let success;
  let stage = 'unknown';
  
  // Determine current test stage based on execution time
  const elapsed = __ITER * 3; // Approximate seconds (with 3s think time)
  if (elapsed < 120) {
    stage = 'ramp_to_100';
  } else if (elapsed < 240) {
    stage = 'ramp_to_200';
  } else if (elapsed < 420) {
    stage = 'sustain_200_CRITICAL';  // This is where we expect issues
  } else {
    stage = 'ramp_down';
  }
  
  switch (action) {
    case 'browseProducts':
      // API 1: GET All Products List
      // This is typically the most-hit endpoint during sales events
      response = http.get(`${config.baseURL}/productsList`, {
        tags: { 
          name: 'BrowseProducts',
          stage: stage,
        },
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
      });
      
      // Track breaking point indicators
      if (response.timings.duration > 3000) {
        slowResponsesCounter.add(1, { endpoint: 'browse', stage: stage });
      }
      if (response.timings.duration > 5000) {
        verySlowResponsesCounter.add(1, { endpoint: 'browse', stage: stage });
      }
      if (!success) {
        errorsByStage.add(1, { endpoint: 'browse', stage: stage });
      }
      
      browseProductsRate.add(success);
      browseProductsDuration.add(response.timings.duration);
      actionCounter.add(1, { action: 'browseProducts' });
      break;
      
    case 'searchItems':
      // POST Search Product
      // Search is typically more resource-intensive than simple GET
      const searchTerm = getRandomSearchTerm();
      
      response = http.post(
        `${config.baseURL}/searchProduct`,
        { search_product: searchTerm },
        {
          tags: { 
            name: 'SearchItems',
            stage: stage,
          },
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
      });
      
      // Track breaking point indicators
      if (response.timings.duration > 3000) {
        slowResponsesCounter.add(1, { endpoint: 'search', stage: stage });
      }
      if (response.timings.duration > 5000) {
        verySlowResponsesCounter.add(1, { endpoint: 'search', stage: stage });
      }
      if (!success) {
        errorsByStage.add(1, { endpoint: 'search', stage: stage });
      }
      
      searchItemsRate.add(success);
      searchItemsDuration.add(response.timings.duration);
      actionCounter.add(1, { action: 'searchItems' });
      break;
  }
  
  // Realistic user think time during high-traffic events
  // Users are more frantic during sales, so shorter think time
  sleep(Math.random() * 2 + 1);  // 1-3 seconds (vs 1-5 in normal load test)
}

// Setup function - runs once before the test starts
export function setup() {
  console.log('='.repeat(80));
  console.log('🔥 STRESS TEST: Prime Day / Cyber Monday Preparation');
  console.log('='.repeat(80));
  console.log(`Base URL: ${config.baseURL}`);
  console.log(`Test Duration: ${config.stressScenarios.prime_day.totalDuration}`);
  console.log('');
  console.log('📊 Test Scenario:');
  console.log(`  Phase 1 (2 min): Ramp up to ${config.stressScenarios.prime_day.startUsers} users (last year's comfortable zone)`);
  console.log(`  Phase 2 (2 min): Push to ${config.stressScenarios.prime_day.targetUsers} users (this year's expected peak)`);
  console.log(`  Phase 3 (3 min): CRITICAL - Sustain ${config.stressScenarios.prime_day.targetUsers} users to find breaking points`);
  console.log(`  Phase 4 (1 min): Ramp down to observe recovery`);
  console.log('');
  console.log('🎯 User Behavior (High-Traffic Endpoints):');
  console.log(`  - ${config.stressUserBehavior.browsingProducts}% Browsing Products (GET /productsList - API 1)`);
  console.log(`  - ${config.stressUserBehavior.searchingItems}% Searching Items (POST /searchProduct)`);
  console.log('');
  console.log('🔍 What We\'re Looking For (Breaking Points):');
  console.log('  ❓ At what point do response times exceed 3 seconds?');
  console.log('  ❓ When do error rates spike above 1%?');
  console.log('  ❓ What fails first: database, API server, memory?');
  console.log('  ❓ Can the system sustain 200 concurrent users?');
  console.log('');
  console.log('⚠️  IMPORTANT: Some thresholds MAY fail - that\'s the point!');
  console.log('   We need to find your limits BEFORE the actual event.');
  console.log('='.repeat(80));
  console.log('');
  
  return {
    startTime: new Date().toISOString(),
  };
}

// Teardown function - runs once after the test completes
export function teardown(data) {
  console.log('');
  console.log('='.repeat(80));
  console.log('🔥 STRESS TEST COMPLETED');
  console.log('='.repeat(80));
  console.log('');
  console.log('📊 Key Questions to Answer from Results:');
  console.log('');
  console.log('1. Breaking Point Analysis:');
  console.log('   ➜ Check "slow_responses_over_3s" count');
  console.log('   ➜ Check "very_slow_responses_over_5s" count');
  console.log('   ➜ Review p(95) and p(99) response times');
  console.log('');
  console.log('2. Error Rate Analysis:');
  console.log('   ➜ Check "http_req_failed" percentage');
  console.log('   ➜ Review "errors_by_stage" to see when failures started');
  console.log('');
  console.log('3. Endpoint Comparison:');
  console.log('   ➜ Compare "browse_products_duration" vs "search_items_duration"');
  console.log('   ➜ Which endpoint fails first?');
  console.log('');
  console.log('4. Capacity Planning:');
  console.log('   ➜ Can the system sustain 200 users for 3 minutes?');
  console.log('   ➜ If yes: You\'re ready for Prime Day!');
  console.log('   ➜ If no: Review the metrics to find bottlenecks');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   - Open the HTML report for detailed visualization');
  console.log('   - Look for trends: when did performance degrade?');
  console.log('   - Monitor server resources during the test (CPU, memory, DB)');
  console.log('   - If thresholds failed, consider infrastructure improvements');
  console.log('='.repeat(80));
}

// Handle summary data for custom analysis
export function handleSummary(data) {
  const slowRequests = data.metrics.slow_responses_over_3s?.values.count || 0;
  const verySlowRequests = data.metrics.very_slow_responses_over_5s?.values.count || 0;
  const errorRate = data.metrics.http_req_failed?.values.rate || 0;
  const p95 = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const p99 = data.metrics.http_req_duration?.values['p(99)'] || 0;
  
  console.log('');
  console.log('🎯 QUICK STRESS TEST SUMMARY:');
  console.log(`   Requests over 3s: ${slowRequests}`);
  console.log(`   Requests over 5s: ${verySlowRequests}`);
  console.log(`   Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log(`   P95 response time: ${p95.toFixed(2)}ms`);
  console.log(`   P99 response time: ${p99.toFixed(2)}ms`);
  console.log('');
  
  // Verdict
  if (errorRate < 0.01 && p95 < 3000) {
    console.log('✅ VERDICT: System can handle 200 concurrent users!');
    console.log('   You\'re ready for Prime Day / Cyber Monday! 🎉');
  } else if (errorRate < 0.05 && p95 < 5000) {
    console.log('⚠️  VERDICT: System is at its limits with 200 users');
    console.log('   Consider infrastructure improvements before the big event.');
  } else {
    console.log('❌ VERDICT: System cannot sustain 200 concurrent users');
    console.log('   URGENT: Infrastructure improvements needed!');
  }
  console.log('');
  
  return {
    'stdout': '', // Let k6 handle the standard output
  };
}
