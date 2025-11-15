# Stress Testing - Prime Day / Cyber Monday Preparation

## 🔥 Overview

This stress test simulates a **Prime Day / Cyber Monday** scenario to find your system's breaking point BEFORE the actual event.

## 🎯 Real-World Scenario

**Situation**: 
- Last year's Prime Day peaked at **150 concurrent users**
- This year you expect **200+ concurrent users**
- **Need to know**: Can your system handle it? What breaks first?

## 📊 Test Phases

The stress test runs for **6 minutes total**:

### Phase 1: Comfortable Zone (2 min)
- **Start**: 0 users
- **Target**: 100 users
- **Purpose**: Validate last year's known capacity

### Phase 2: Expected Peak (2 min)
- **From**: 100 users
- **To**: 200 users
- **Purpose**: Push to this year's expected peak

### Phase 3: CRITICAL - Find Breaking Points (3 min)
- **Sustain**: 200 users
- **Purpose**: See what breaks under sustained load
- **Monitor**: Response times, error rates, system resources

### Phase 4: Recovery (1 min)
- **From**: 200 users
- **To**: 0 users
- **Purpose**: Observe system recovery

## 🎯 What We're Testing

### Traffic Distribution
- **70%** Browse Products (`GET /productsList` - API 1)
  - Most users browse during sales events
- **30%** Search Items (`POST /searchProduct`)
  - Users searching for specific deals

### Critical Questions to Answer

1. **At what point do response times exceed 3 seconds?**
   - Tracked via `slow_responses_over_3s` metric

2. **When do error rates spike above 1%?**
   - Tracked via `http_req_failed` metric

3. **What fails first: database, API server, memory?**
   - Analyze by endpoint and stage

4. **Can the system sustain 200 concurrent users?**
   - Overall verdict based on all metrics

## 🚀 Running the Stress Test

### Quick Start

```bash
# Run stress test with HTML report (RECOMMENDED)
npm run perf:stress:html

# Run stress test only (no report)
npm run perf:stress
```

### What to Expect

- **Duration**: 6 minutes
- **Peak Users**: 200 concurrent users
- **Console Output**: Real-time metrics and verdict
- **HTML Report**: Detailed breaking point analysis

## 📊 Understanding Results

### Success Criteria

✅ **PASSED** - System Ready for Prime Day:
- P95 response time < 3000ms
- Error rate < 1%
- No sustained degradation at 200 users

⚠️ **WARNING** - At Limits:
- P95 response time < 5000ms
- Error rate < 5%
- Infrastructure improvements recommended

❌ **FAILED** - Urgent Action Needed:
- P95 response time > 5000ms
- Error rate > 5%
- Immediate infrastructure changes required

### Key Metrics to Review

1. **Slow Responses (>3s)**
   - How many requests exceeded 3 seconds?
   - At what stage did they occur?

2. **Very Slow Responses (>5s)**
   - How many requests exceeded 5 seconds?
   - Critical performance issues

3. **Errors by Stage**
   - When did errors start occurring?
   - Which phase shows degradation?

4. **Endpoint Comparison**
   - Which endpoint fails first?
   - Browse vs Search performance

## 📈 HTML Report Features

The stress test report (`k6-tests/reports/stress-test-report.html`) includes:

### Verdict Banner
- ✅ Pass / ⚠️ Warning / ❌ Fail
- Quick summary of results

### Breaking Point Analysis
- Answers to all 4 critical questions
- Visual indicators of issues

### Performance by Stage
- See exactly when performance degraded
- Compare all 4 test phases

### Endpoint Comparison
- Browse Products vs Search Items
- Identify which endpoint is the bottleneck

### Recommendations
- Specific actions based on results
- Infrastructure improvement suggestions

## 💡 What to Monitor

### During the Test

Monitor your server for:
- **CPU Usage**: Does it spike to 100%?
- **Memory Usage**: Any memory leaks?
- **Database Connections**: Connection pool exhaustion?
- **Network I/O**: Bandwidth saturation?

### After the Test

Review the HTML report for:
- When did performance start degrading?
- Which endpoint is the bottleneck?
- What stage showed the most errors?
- Is the system ready for 200+ users?

## 🔧 Customizing the Test

### Change User Targets

Edit `k6-tests/utils/config.js`:

```javascript
stressScenarios: {
  prime_day: {
    startUsers: 100,    // Last year's peak
    targetUsers: 200,   // This year's target
    // ... other settings
  }
}
```

### Change Test Duration

Edit `k6-tests/scripts/stress-test.js`:

```javascript
stages: [
  { duration: '2m', target: 100 },  // Phase 1
  { duration: '2m', target: 200 },  // Phase 2
  { duration: '3m', target: 200 },  // Phase 3 (sustain)
  { duration: '1m', target: 0 },    // Phase 4
]
```

### Change Traffic Mix

Edit `k6-tests/utils/config.js`:

```javascript
stressUserBehavior: {
  browsingProducts: 70,  // % for Browse
  searchingItems: 30,    // % for Search
}
```

## 📋 Example Workflow

### Before Prime Day (2-4 weeks ahead)

```bash
# 1. Run stress test
npm run perf:stress:html

# 2. Review report
# Open: k6-tests/reports/stress-test-report.html

# 3. If FAILED or WARNING:
#    - Implement infrastructure improvements
#    - Optimize slow endpoints
#    - Scale resources

# 4. Re-run test to validate improvements
npm run perf:stress:html

# 5. Repeat until PASSED
```

### During Prime Day

- Monitor real-time metrics
- Compare against stress test results
- Be ready to scale if needed

### After Prime Day

- Compare actual traffic vs stress test
- Use data for next year's planning
- Update stress test targets

## 🐛 Troubleshooting

### High Error Rates

**Symptoms**: Error rate > 1%

**Solutions**:
- Check API server logs
- Review database connection pool size
- Verify network capacity
- Check for rate limiting

### Slow Response Times

**Symptoms**: P95 > 3000ms

**Solutions**:
- Optimize database queries
- Implement caching (Redis, Memcached)
- Scale server instances horizontally
- Use CDN for static content

### System Crashes

**Symptoms**: Test doesn't complete

**Solutions**:
- Increase server memory
- Fix memory leaks
- Optimize resource usage
- Implement proper error handling

## 📊 Sample Results

### Good Result (PASSED)
```
Peak: 200 users
P95: 1850ms ✓
Error Rate: 0.5% ✓
Slow Requests: 12 ✓
Verdict: ✅ System Ready for Prime Day!
```

### Warning Result
```
Peak: 200 users
P95: 4200ms ⚠️
Error Rate: 2.5% ⚠️
Slow Requests: 350 ⚠️
Verdict: ⚠️ At Limits - Improvements Recommended
```

### Failed Result
```
Peak: 200 users
P95: 8500ms ❌
Error Rate: 12% ❌
Slow Requests: 1250 ❌
Verdict: ❌ Urgent Action Needed!
```

## 🎓 Best Practices

1. **Run Early**: 2-4 weeks before the event
2. **Run Multiple Times**: After each improvement
3. **Monitor Everything**: Server metrics + test metrics
4. **Start Conservative**: Begin with known capacity
5. **Document Results**: Track improvements over time
6. **Test Realistic Patterns**: Use actual traffic distribution

## 🔗 Related Tests

- **Smoke Test**: Quick validation (`npm run perf:demo`)
- **Load Test**: Regular traffic pattern (`npm run perf:load:html`)
- **Stress Test**: Breaking point analysis (`npm run perf:stress:html`)

---

**Ready to find your breaking point? 🔥**

```bash
npm run perf:stress:html
```

**Better to know NOW than during the actual event!**
