# 🔥 Stress Test Implementation - Complete!

## ✅ What Was Created

A comprehensive **Prime Day / Cyber Monday** stress testing suite to find your system's breaking point.

### 📦 New Files

1. **`k6-tests/scripts/stress-test.js`**
   - 6-minute stress test scenario
   - Ramps from 100 → 200 concurrent users
   - Focuses on API 1 (Browse Products) and POST Search
   - Tracks breaking point metrics

2. **`k6-tests/utils/generate-stress-report.js`**
   - Beautiful HTML report generator
   - Breaking point analysis
   - Stage-by-stage performance comparison
   - Automatic verdict and recommendations

3. **`k6-tests/STRESS_TEST_GUIDE.md`**
   - Complete stress testing guide
   - Real-world scenario explanation
   - Troubleshooting tips
   - Best practices

4. **Updated Configuration**
   - `k6-tests/utils/config.js` - Stress test settings
   - `package.json` - New NPM scripts
   - `k6-tests/README.md` - Updated documentation
   - `k6-tests/QUICK_REFERENCE.md` - Added stress test commands

## 🎯 Real-World Scenario

### The Problem
- **Last Year**: Prime Day peaked at 150 concurrent users
- **This Year**: Expecting 200+ concurrent users
- **Question**: Can your system handle it? What breaks first?

### The Solution
A 6-minute stress test that:
1. Starts at 100 users (comfortable zone)
2. Pushes to 200 users (expected peak)
3. Sustains 200 users for 3 minutes (find breaking points!)
4. Ramps down to observe recovery

## 🚀 How to Use

### Quick Start

```bash
# Run stress test with HTML report (RECOMMENDED)
npm run perf:stress:html

# View the report
# Opens: k6-tests/reports/stress-test-report.html
```

### Test Duration
- **Phase 1 (2 min)**: Ramp to 100 users - Last year's peak
- **Phase 2 (2 min)**: Push to 200 users - This year's target
- **Phase 3 (3 min)**: CRITICAL - Sustain 200 users to find limits
- **Phase 4 (1 min)**: Ramp down - Observe recovery
- **Total**: 6 minutes

### What's Being Tested

**Traffic Distribution:**
- **70%** Browse Products (`GET /productsList` - API 1)
- **30%** Search Items (`POST /searchProduct`)

**Why these endpoints?**
- Most hit during sales events
- Search is resource-intensive
- Representative of real traffic

## 📊 Understanding Results

### ✅ PASSED - Ready for Prime Day!
```
P95 < 3000ms
Error Rate < 1%
Slow Requests < 100
Verdict: System can handle 200+ users!
```

### ⚠️ WARNING - At Limits
```
P95 < 5000ms
Error Rate < 5%
Slow Requests < 500
Verdict: Infrastructure improvements recommended
```

### ❌ FAILED - Urgent Action Needed
```
P95 > 5000ms
Error Rate > 5%
Slow Requests > 500
Verdict: Critical infrastructure changes required!
```

## 🔍 Key Metrics Tracked

### Breaking Point Indicators
1. **Slow Responses (>3s)**: When do requests start taking too long?
2. **Very Slow Responses (>5s)**: Critical performance issues
3. **Errors by Stage**: When do errors start occurring?
4. **Response Time Trends**: How does performance degrade?

### Critical Questions Answered
1. ❓ At what point do response times exceed 3 seconds?
2. ❓ When do error rates spike above 1%?
3. ❓ What fails first: database, API server, memory?
4. ❓ Can the system sustain 200 concurrent users?

## 📈 HTML Report Features

The stress test report includes:

### 1. Verdict Banner
- Large, color-coded result
- Quick summary of system readiness
- Pass/Warning/Fail indication

### 2. Breaking Point Analysis
- Answers to all 4 critical questions
- Visual indicators for each metric
- Clear pass/fail status

### 3. Performance by Stage
- See exactly when performance degraded
- Compare all 4 test phases
- Identify the breaking point

### 4. Endpoint Comparison
- Browse Products vs Search Items
- Identify bottlenecks
- See which endpoint fails first

### 5. Recommendations
- Specific actions based on results
- Infrastructure improvement suggestions
- Tailored to your verdict (Pass/Warning/Fail)

## 💡 What to Monitor

### During the Test (Server-Side)
- **CPU Usage**: Does it spike to 100%?
- **Memory Usage**: Any memory leaks?
- **Database Connections**: Pool exhaustion?
- **Network I/O**: Bandwidth saturation?
- **Error Logs**: What errors appear?

### After the Test (Report Analysis)
- **When did performance degrade?**
  - Check the stage analysis
  - Look for trends in response times

- **Which endpoint is the bottleneck?**
  - Compare Browse vs Search
  - Check individual P95/P99 times

- **What stage had the most errors?**
  - Review errors by stage
  - Identify critical phase

## 🔧 Customization

### Change User Targets

Edit `k6-tests/utils/config.js`:

```javascript
stressScenarios: {
  prime_day: {
    startUsers: 100,    // Last year's peak
    targetUsers: 200,   // This year's expected target
    // ...
  }
}
```

### Change Traffic Mix

```javascript
stressUserBehavior: {
  browsingProducts: 70,  // % browsing
  searchingItems: 30,    // % searching
}
```

### Change Test Duration

Edit `k6-tests/scripts/stress-test.js`:

```javascript
stages: [
  { duration: '2m', target: 100 },  // Phase 1: Ramp to 100
  { duration: '2m', target: 200 },  // Phase 2: Push to 200
  { duration: '3m', target: 200 },  // Phase 3: Sustain (critical!)
  { duration: '1m', target: 0 },    // Phase 4: Ramp down
]
```

## 📋 Recommended Workflow

### 2-4 Weeks Before Prime Day

```bash
# 1. Run stress test
npm run perf:stress:html

# 2. Review the report
# Open: k6-tests/reports/stress-test-report.html

# 3. Analyze results
# - Did it PASS, WARNING, or FAIL?
# - What were the breaking points?
# - Which endpoint is the bottleneck?

# 4. If WARNING or FAIL:
#    a) Implement infrastructure improvements
#    b) Optimize slow endpoints
#    c) Scale resources (CPU, memory, DB)
#    d) Add caching (Redis, CDN)

# 5. Re-run to validate improvements
npm run perf:stress:html

# 6. Repeat until PASSED!
```

### During Prime Day
- Monitor real-time metrics
- Compare against stress test predictions
- Be ready to scale if needed
- Have rollback plan ready

### After Prime Day
- Compare actual vs predicted traffic
- Document what worked/failed
- Update stress test for next year
- Plan infrastructure improvements

## 🎓 Best Practices

1. **Test Early**: 2-4 weeks before the event
2. **Test Often**: After each infrastructure change
3. **Monitor Everything**: Server metrics + test metrics
4. **Document Results**: Track improvements over time
5. **Start Conservative**: Begin with known capacity
6. **Push the Limits**: That's the point of stress testing!
7. **Have a Plan**: Know what to do if test fails

## 🐛 Common Issues & Solutions

### Issue: High Error Rates (>1%)
**Root Causes:**
- API server overwhelmed
- Database connection pool exhausted
- Network bandwidth saturated

**Solutions:**
- Scale server instances horizontally
- Increase database connection pool
- Optimize slow queries
- Add rate limiting with better error messages

### Issue: Slow Response Times (P95 >3s)
**Root Causes:**
- Inefficient database queries
- No caching layer
- Insufficient server resources
- Network latency

**Solutions:**
- Implement caching (Redis, Memcached)
- Optimize database indices
- Use CDN for static content
- Scale server resources (CPU, RAM)
- Add read replicas for database

### Issue: System Crashes
**Root Causes:**
- Memory leaks
- Insufficient resources
- Unhandled exceptions
- Database deadlocks

**Solutions:**
- Fix memory leaks in code
- Increase server memory
- Implement proper error handling
- Optimize database transactions
- Add health checks and auto-recovery

## 📊 All Available Tests

| Test | Command | Duration | Users | Purpose |
|------|---------|----------|-------|---------|
| **Smoke** | `npm run perf:demo` | 1 min | 3 | Quick validation |
| **Load** | `npm run perf:load:html` | 8 min | 50 | Normal traffic |
| **Stress** 🔥 | `npm run perf:stress:html` | 6 min | 200 | Find breaking points |

## 🔗 Documentation

- **[STRESS_TEST_GUIDE.md](STRESS_TEST_GUIDE.md)** - Complete stress test guide
- **[README.md](README.md)** - Main k6 testing documentation
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick command reference

## 🎉 You're All Set!

The stress test is currently running. It will:

1. ✅ Test your system with 200 concurrent users
2. ✅ Find breaking points and bottlenecks
3. ✅ Generate a beautiful HTML report with recommendations
4. ✅ Answer all critical questions about system capacity

### When the test completes:

```bash
# The report will be automatically generated
# Look for this message:
🔥 STRESS TEST REPORT GENERATED!

# Open the report
open k6-tests/reports/stress-test-report.html
```

---

**Better to find your limits NOW than during the actual Prime Day! 🔥**

**Good luck with your stress test! 🚀**
