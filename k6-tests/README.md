# k6 Performance Testing Suite

## 📋 Overview

This directory contains performance tests for the AutomationExercise API using k6, a modern load testing tool. The tests simulate real-world e-commerce traffic patterns including:
- **Load Testing**: Lunch hour traffic simulation
- **Stress Testing**: Prime Day / Cyber Monday preparation

## 🎯 Requirements

Based on the following requirements:

### Business Requirements
- **Typical Traffic**: 50 concurrent users browsing products during lunch hours (12-2 PM)
- **Test Duration**: 8 minutes total
  - 2 minutes: Ramp up to 50 users (gradual lunch break traffic)
  - 5 minutes: Sustain 50 users (peak lunch period)
  - 1 minute: Ramp down to 0 (people return to work)
- **Maximum Capacity**: System can handle up to 100 concurrent users

### User Behavior Distribution
- **60%** - Browsing products (`GET /productsList`)
- **25%** - Searching for items (`POST /searchProduct`)
- **15%** - Checking brands (`GET /brandsList`)

### Performance Thresholds
- 95th percentile response time: < 2000ms
- 99th percentile response time: < 5000ms
- Success rate: > 99%
- Error rate: < 1%

## 📁 Directory Structure

```
k6-tests/
├── scripts/
│   ├── load-test.js      # Main load test (8-minute lunch hour simulation)
│   ├── smoke-test.js     # Quick demo test (1-minute validation)
│   └── stress-test.js    # Stress test (6-minute Prime Day simulation)
├── utils/
│   ├── config.js         # Shared configuration and constants
│   ├── generate-html-report.js      # Load test HTML report generator
│   └── generate-stress-report.js    # Stress test HTML report generator
├── reports/              # Generated test reports (JSON & HTML)
├── README.md            # This file
├── STRESS_TEST_GUIDE.md # Detailed stress testing guide
└── QUICK_REFERENCE.md   # Quick command reference
```

## 🚀 Getting Started

### Prerequisites

1. **Install k6** (already done):
   ```bash
   brew install k6
   ```

2. **Verify installation**:
   ```bash
   k6 version
   ```

### Available Test Scripts

All scripts are available in `package.json`:

| Script | Description | Use Case |
|--------|-------------|----------|
| `npm run perf:demo` | Quick smoke test (3 users, 1 min) | Validate APIs before load testing |
| `npm run perf:smoke` | Same as demo | Quick validation |
| `npm run perf:load` | Full load test (50 users, 8 min) | Main performance test |
| `npm run perf:load:html` | Load test + HTML report | Production testing with reports |
| `npm run perf:stress` | Stress test (200 users, 6 min) | Find breaking points |
| `npm run perf:stress:html` | Stress test + HTML report | Prime Day preparation |
| `npm run perf:clean` | Clean up report files | Cleanup |

## 📊 Running Tests

### Step 1: Demo/Smoke Test (Recommended First)

Run a quick validation to ensure all APIs are working:

```bash
npm run perf:demo
```

This runs a lightweight test with:
- 3 virtual users
- 1 minute duration
- Tests all three API endpoints
- Quick validation before full load test

**Expected output:**
```
✓ browse products works
✓ search items works
✓ check brands works
```

### Step 2: Full Load Test

Once the smoke test passes, run the full load test:

```bash
npm run perf:load
```

This simulates the lunch hour traffic pattern:
- Ramps up to 50 users over 2 minutes
- Sustains 50 users for 5 minutes
- Ramps down over 1 minute
- Total duration: 8 minutes

### Step 3: Generate HTML Report

To run the load test and automatically generate an HTML report:

```bash
npm run perf:load:html
```

The HTML report will be saved to:
```
k6-tests/reports/load-test-report.html
```

Open it in your browser to see:
- Overall performance metrics
- User action distribution
- Response time percentiles (P50, P95, P99)
- Success rates per endpoint
- Visual status indicators

## 📈 Understanding Results

### Console Output

After running tests, k6 displays:

```
✓ browse products: status is 200
✓ search items: status is 200
✓ check brands: status is 200

http_req_duration..............: avg=XXXms min=XXXms med=XXXms max=XXXms p(95)=XXXms p(99)=XXXms
http_req_failed................: X.XX%
iterations.....................: XXXX
vus............................: 0/50 (min/max)
```

### Key Metrics to Monitor

1. **http_req_duration (p95)**: Should be < 2000ms ✅
2. **http_req_duration (p99)**: Should be < 5000ms ✅
3. **http_req_failed**: Should be < 1% ✅
4. **Success rates**: Should be > 99% ✅

### Threshold Checks

k6 automatically validates thresholds. Look for:
- ✓ Green checkmarks = Passed
- ✗ Red X marks = Failed

## 🔧 Test Configuration

### Modifying User Behavior

Edit `k6-tests/utils/config.js`:

```javascript
userBehavior: {
  browsingProducts: 60,  // Change percentages here
  searchingItems: 25,
  checkingBrands: 15
}
```

### Modifying Load Pattern

Edit `k6-tests/scripts/load-test.js`:

```javascript
stages: [
  { duration: '2m', target: 50 },  // Ramp up
  { duration: '5m', target: 50 },  // Sustain
  { duration: '1m', target: 0 },   // Ramp down
]
```

### Modifying Thresholds

Edit `k6-tests/utils/config.js`:

```javascript
thresholds: {
  http_req_duration_p95: 2000,  // 95th percentile in ms
  http_req_duration_p99: 5000,  // 99th percentile in ms
  http_req_failed_rate: 0.01,   // 1% error rate
  http_req_success_rate: 0.99   // 99% success rate
}
```

## 📝 Test Scenarios Explained

### Smoke Test (`smoke-test.js`)
- **Purpose**: Quick validation that APIs are functional
- **Users**: 3 concurrent users
- **Duration**: 1 minute
- **Use When**: Before running full load tests, CI/CD pipeline validation

### Load Test (`load-test.js`)
- **Purpose**: Simulate realistic lunch hour traffic
- **Pattern**: Gradual ramp-up, sustained peak, gradual ramp-down
- **Users**: Up to 50 concurrent users (well below 100 max capacity)
- **Duration**: 8 minutes total
- **Use When**: Performance validation, regression testing, capacity planning

### Stress Test (`stress-test.js`) 🔥
- **Purpose**: Find your breaking point before Prime Day/Cyber Monday
- **Pattern**: Ramp to 100 → Push to 200 → Sustain to find limits
- **Users**: Up to 200 concurrent users (2x expected capacity)
- **Duration**: 6 minutes total
- **Use When**: Pre-event preparation, capacity planning, finding bottlenecks
- **Details**: See [STRESS_TEST_GUIDE.md](STRESS_TEST_GUIDE.md)

## 🎨 HTML Report Features

The generated HTML report includes:

- **Summary Cards**: Duration, total requests, peak users, success rate
- **Performance Metrics Table**: Min, Avg, Median, P95, P99, Max response times
- **Action Distribution**: Visual breakdown of user behavior (60/25/15 split)
- **Per-Action Metrics**: Individual performance for each API endpoint
- **Test Configuration**: Complete test setup details
- **Color-coded Status**: Green (pass), Yellow (warning), Red (fail)

## 🐛 Troubleshooting

### Issue: "command not found: k6"
**Solution**: Install k6 with `brew install k6`

### Issue: No report generated
**Solution**: Make sure to run `npm run perf:load` first to generate JSON results

### Issue: High error rates
**Solution**: 
1. Check API availability
2. Run smoke test first: `npm run perf:demo`
3. Reduce concurrent users in load test

### Issue: Thresholds failing
**Solution**:
1. Check if API can handle the load
2. Adjust thresholds in config.js if realistic
3. Consider infrastructure improvements

## 📊 Sample Results

Expected distribution for successful test:

```
Browse Products: ~60% of requests
Search Items: ~25% of requests
Check Brands: ~15% of requests

P95 Response Time: < 2000ms ✓
P99 Response Time: < 5000ms ✓
Success Rate: > 99% ✓
```

## 🔗 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/introduction/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)

## 📞 Support

For issues or questions:
1. Check the console output for error messages
2. Review the HTML report for detailed metrics
3. Verify API endpoints are accessible
4. Check k6 documentation for advanced configuration

---

**Happy Load Testing! 🚀**
