# k6 Performance Testing - Quick Reference

## 🚀 Commands

```bash
# Run smoke test (demo) - 1 minute, 3 users
npm run perf:demo

# Run full load test - 8 minutes, 50 users
npm run perf:load

# Run load test + generate HTML report
npm run perf:load:html

# Run stress test - 6 minutes, 200 users 🔥
npm run perf:stress

# Run stress test + generate HTML report 🔥
npm run perf:stress:html

# Clean up reports
npm run perf:clean
```

## 📊 Test Scenarios

### Smoke Test
- **Users**: 3
- **Duration**: 1 minute
- **Purpose**: Quick validation before full test

### Load Test
- **Pattern**: Lunch hour traffic simulation
- **Phase 1**: Ramp up 0→50 users (2 min)
- **Phase 2**: Sustain 50 users (5 min)
- **Phase 3**: Ramp down 50→0 users (1 min)
- **Total**: 8 minutes

### Stress Test 🔥
- **Pattern**: Prime Day / Cyber Monday preparation
- **Phase 1**: Ramp to 100 users (2 min)
- **Phase 2**: Push to 200 users (2 min)
- **Phase 3**: Sustain 200 users (3 min) - Find breaking points!
- **Phase 4**: Ramp down (1 min)
- **Total**: 6 minutes

## 🎯 User Behavior

**Load Test:**
- 60% Browse Products
- 25% Search Items
- 15% Check Brands

**Stress Test:**
- 70% Browse Products (API 1)
- 30% Search Items (POST)

## ✅ Performance Targets

- P95 < 2000ms
- P99 < 5000ms
- Success Rate > 99%
- Error Rate < 1%

## 📁 Key Files

- `scripts/load-test.js` - Main load test
- `scripts/smoke-test.js` - Quick test
- `scripts/stress-test.js` - Stress test 🔥
- `utils/config.js` - Configuration
- `reports/load-test-report.html` - Load test results
- `reports/stress-test-report.html` - Stress test results
- `STRESS_TEST_GUIDE.md` - Detailed stress test guide

## 🔧 Customization

Edit `utils/config.js` to change:
- User behavior percentages
- Performance thresholds
- Max capacity settings

Edit `scripts/load-test.js` to change:
- Number of users
- Test duration
- Ramp-up/down times
