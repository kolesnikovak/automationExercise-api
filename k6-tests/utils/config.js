// k6 Configuration for AutomationExercise API Load Testing

export const config = {
  // Base URL for the API
  baseURL: 'https://automationexercise.com/api',
  
  // Test scenarios configuration
  scenarios: {
    lunch_hour_traffic: {
      // Ramp up: 2 minutes to reach 50 users
      rampUpDuration: '2m',
      rampUpTarget: 50,
      
      // Sustain: 5 minutes at 50 users (peak lunch period)
      sustainDuration: '5m',
      sustainTarget: 50,
      
      // Ramp down: 1 minute back to 0 (people return to work)
      rampDownDuration: '1m',
      rampDownTarget: 0,
      
      // Total duration: 8 minutes
      totalDuration: '8m'
    }
  },
  
  // User behavior distribution (must sum to 100%)
  userBehavior: {
    browsingProducts: 60,  // 60% of requests are browsing products
    searchingItems: 25,     // 25% of requests are searching
    checkingBrands: 15      // 15% of requests are checking brands
  },
  
  // Performance thresholds
  thresholds: {
    // 95% of requests should complete within 2 seconds
    http_req_duration_p95: 2000,
    
    // 99% of requests should complete within 5 seconds
    http_req_duration_p99: 5000,
    
    // Error rate should be less than 1%
    http_req_failed_rate: 0.01,
    
    // Minimum success rate: 99%
    http_req_success_rate: 0.99
  },
  
  // System capacity
  maxCapacity: {
    users: 100,
    description: 'Maximum concurrent users the system can handle'
  },
  
  // Stress test scenarios - Prime Day / Cyber Monday preparation
  stressScenarios: {
    prime_day: {
      // Start at comfortable zone from last year's data
      startUsers: 100,
      
      // Expected peak for this year
      targetUsers: 200,
      
      // Ramp up time to reach peak
      rampUpDuration: '2m',
      
      // Hold at peak to find breaking points
      sustainDuration: '3m',
      
      // Gradual ramp down
      rampDownDuration: '1m',
      
      // Total duration
      totalDuration: '6m',
      
      // What to monitor
      criticalThresholds: {
        maxResponseTime: 3000,  // 3 seconds - when does it exceed?
        maxErrorRate: 0.01,     // 1% - when do errors spike?
      }
    }
  },
  
  // Stress test user behavior - focused on high-traffic endpoints
  stressUserBehavior: {
    browsingProducts: 70,   // 70% - Most users browse (GET /productsList - API 1)
    searchingItems: 30,     // 30% - Search for specific items (POST /searchProduct)
  }
};

// Helper function to determine which action a virtual user should take
// based on the configured distribution percentages
export function selectUserAction() {
  const random = Math.random() * 100;
  
  if (random < config.userBehavior.browsingProducts) {
    return 'browseProducts';
  } else if (random < config.userBehavior.browsingProducts + config.userBehavior.searchingItems) {
    return 'searchItems';
  } else {
    return 'checkBrands';
  }
}

// Common search terms for realistic traffic simulation
export const searchTerms = [
  'top',
  'dress',
  'jeans',
  'shirt',
  'tshirt',
  'saree',
  'cotton',
  'blue',
  'men',
  'women',
  'kids',
  'polo',
  'winter',
  'summer'
];

// Helper to get random search term
export function getRandomSearchTerm() {
  return searchTerms[Math.floor(Math.random() * searchTerms.length)];
}
