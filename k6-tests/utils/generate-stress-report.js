const fs = require('fs');
const path = require('path');

// Read the k6 JSON output for stress test
const jsonPath = path.join(__dirname, '../reports/stress-test-results.json');
const htmlPath = path.join(__dirname, '../reports/stress-test-report.html');

if (!fs.existsSync(jsonPath)) {
  console.error('Error: No stress test results found. Run the stress test first with: npm run perf:stress');
  process.exit(1);
}

const fileContent = fs.readFileSync(jsonPath, 'utf8');
const lines = fileContent.trim().split('\n');

// Parse k6 metrics
const metrics = {
  http_req_duration: [],
  http_req_failed: [],
  vus: [],
  iterations: 0,
  data_sent: 0,
  data_received: 0,
  checks_passed: 0,
  checks_failed: 0,
  browse_products: { count: 0, duration: [] },
  search_items: { count: 0, duration: [] },
  slow_responses_3s: 0,
  slow_responses_5s: 0,
  errors_by_stage: {},
  duration_by_stage: {},
};

let testStartTime = null;
let testEndTime = null;

lines.forEach((line) => {
  try {
    const data = JSON.parse(line);
    
    if (data.type === 'Metric' && data.metric === 'http_req_duration' && data.data.value) {
      metrics.http_req_duration.push(data.data.value);
      
      if (!testStartTime || data.data.time < testStartTime) {
        testStartTime = data.data.time;
      }
      if (!testEndTime || data.data.time > testEndTime) {
        testEndTime = data.data.time;
      }
    }
    
    if (data.type === 'Point' && data.metric === 'vus' && data.data.value) {
      metrics.vus.push({ time: data.data.time, value: data.data.value });
    }
    
    if (data.type === 'Point' && data.metric === 'iterations') {
      metrics.iterations++;
    }
    
    if (data.type === 'Point' && data.metric === 'data_sent' && data.data.value) {
      metrics.data_sent += data.data.value;
    }
    
    if (data.type === 'Point' && data.metric === 'data_received' && data.data.value) {
      metrics.data_received += data.data.value;
    }
    
    if (data.type === 'Point' && data.metric === 'checks') {
      if (data.data.value === 1) {
        metrics.checks_passed++;
      } else {
        metrics.checks_failed++;
      }
    }
    
    // Track slow responses
    if (data.type === 'Point' && data.metric === 'slow_responses_over_3s') {
      metrics.slow_responses_3s++;
    }
    
    if (data.type === 'Point' && data.metric === 'very_slow_responses_over_5s') {
      metrics.slow_responses_5s++;
    }
    
    // Track individual actions
    if (data.type === 'Point' && data.metric === 'http_req_duration' && data.data.tags) {
      const tagName = data.data.tags.name;
      const stage = data.data.tags.stage || 'unknown';
      
      // Track by endpoint
      if (tagName === 'BrowseProducts') {
        metrics.browse_products.count++;
        metrics.browse_products.duration.push(data.data.value);
      } else if (tagName === 'SearchItems') {
        metrics.search_items.count++;
        metrics.search_items.duration.push(data.data.value);
      }
      
      // Track by stage
      if (!metrics.duration_by_stage[stage]) {
        metrics.duration_by_stage[stage] = [];
      }
      metrics.duration_by_stage[stage].push(data.data.value);
    }
    
    // Track errors by stage
    if (data.type === 'Point' && data.metric === 'errors_by_stage') {
      const stage = data.data.tags?.stage || 'unknown';
      metrics.errors_by_stage[stage] = (metrics.errors_by_stage[stage] || 0) + 1;
    }
  } catch (e) {
    // Skip invalid JSON lines
  }
});

// Calculate statistics
function calculateStats(values) {
  if (values.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p90: sorted[Math.floor(sorted.length * 0.90)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

const durationStats = calculateStats(metrics.http_req_duration);
const browseStats = calculateStats(metrics.browse_products.duration);
const searchStats = calculateStats(metrics.search_items.duration);

const totalChecks = metrics.checks_passed + metrics.checks_failed;
const successRate = totalChecks > 0 ? (metrics.checks_passed / totalChecks * 100).toFixed(2) : 0;
const errorRate = totalChecks > 0 ? (metrics.checks_failed / totalChecks * 100).toFixed(2) : 0;

const testDuration = testEndTime && testStartTime 
  ? ((new Date(testEndTime) - new Date(testStartTime)) / 1000).toFixed(0)
  : 'N/A';

const maxVUs = metrics.vus.length > 0 
  ? Math.max(...metrics.vus.map(v => v.value))
  : 0;

const totalRequests = metrics.browse_products.count + metrics.search_items.count;

// Determine verdict
let verdict = '';
let verdictClass = '';
let verdictIcon = '';

if (errorRate < 1 && durationStats.p95 < 3000) {
  verdict = '✅ PASSED - System can handle 200 concurrent users!';
  verdictClass = 'status-pass';
  verdictIcon = '🎉';
} else if (errorRate < 5 && durationStats.p95 < 5000) {
  verdict = '⚠️ WARNING - System is at its limits';
  verdictClass = 'status-warning';
  verdictIcon = '⚠️';
} else {
  verdict = '❌ FAILED - System cannot sustain 200 users';
  verdictClass = 'status-fail';
  verdictIcon = '🔥';
}

// Generate stage analysis
let stageAnalysisHTML = '';
const stages = ['ramp_to_100', 'ramp_to_200', 'sustain_200_CRITICAL', 'ramp_down'];
stages.forEach(stage => {
  const stageDurations = metrics.duration_by_stage[stage] || [];
  const stageErrors = metrics.errors_by_stage[stage] || 0;
  if (stageDurations.length > 0) {
    const stageStats = calculateStats(stageDurations);
    stageAnalysisHTML += `
    <tr>
      <td><strong>${stage.replace(/_/g, ' ').toUpperCase()}</strong></td>
      <td>${stageDurations.length}</td>
      <td>${stageStats.avg.toFixed(2)} ms</td>
      <td class="${stageStats.p95 < 3000 ? 'status-pass' : 'status-fail'}">${stageStats.p95.toFixed(2)} ms</td>
      <td class="${stageStats.p99 < 5000 ? 'status-pass' : 'status-fail'}">${stageStats.p99.toFixed(2)} ms</td>
      <td>${stageErrors}</td>
      <td class="${stageStats.p95 < 3000 && stageErrors === 0 ? 'status-pass' : stageStats.p95 < 5000 ? 'status-warning' : 'status-fail'}">
        ${stageStats.p95 < 3000 && stageErrors === 0 ? '✓ Good' : stageStats.p95 < 5000 ? '⚠ Degraded' : '✗ Critical'}
      </td>
    </tr>`;
  }
});

// Generate HTML report
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>k6 Stress Test Report - Prime Day Preparation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.1em; opacity: 0.9; }
    .content { padding: 30px; }
    
    .verdict-banner {
      background: ${errorRate < 1 && durationStats.p95 < 3000 ? '#d4edda' : errorRate < 5 ? '#fff3cd' : '#f8d7da'};
      border: 3px solid ${errorRate < 1 && durationStats.p95 < 3000 ? '#28a745' : errorRate < 5 ? '#ffc107' : '#dc3545'};
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 30px;
      text-align: center;
    }
    .verdict-banner h2 {
      font-size: 2em;
      margin-bottom: 10px;
      color: ${errorRate < 1 && durationStats.p95 < 3000 ? '#155724' : errorRate < 5 ? '#856404' : '#721c24'};
    }
    .verdict-banner .icon { font-size: 3em; margin-bottom: 10px; }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #f5576c;
    }
    .card h3 {
      color: #f5576c;
      margin-bottom: 10px;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .card .value {
      font-size: 2em;
      font-weight: bold;
      color: #333;
    }
    .card .unit { font-size: 0.5em; color: #666; margin-left: 5px; }
    
    .section {
      margin-bottom: 30px;
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
    }
    .section h2 {
      color: #f5576c;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f5576c;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      background: #f5576c;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85em;
    }
    tr:hover { background: #f5f5f5; }
    
    .status-pass { color: #28a745; font-weight: bold; }
    .status-fail { color: #dc3545; font-weight: bold; }
    .status-warning { color: #ffc107; font-weight: bold; }
    
    .breaking-points {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin-top: 20px;
      border-radius: 4px;
    }
    .breaking-points h3 {
      color: #856404;
      margin-bottom: 10px;
    }
    .breaking-points ul {
      margin-left: 20px;
      line-height: 2;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 Stress Test Report</h1>
      <p>Prime Day / Cyber Monday Preparation</p>
      <p style="margin-top: 10px; font-size: 0.9em;">Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="content">
      <!-- Verdict Banner -->
      <div class="verdict-banner">
        <div class="icon">${verdictIcon}</div>
        <h2 class="${verdictClass}">${verdict}</h2>
        <p style="margin-top: 10px; font-size: 1.1em;">
          Peak: ${maxVUs} concurrent users | P95: ${durationStats.p95.toFixed(2)}ms | Error Rate: ${errorRate}%
        </p>
      </div>

      <!-- Summary Cards -->
      <div class="summary">
        <div class="card">
          <h3>Test Duration</h3>
          <div class="value">${testDuration}<span class="unit">seconds</span></div>
        </div>
        <div class="card">
          <h3>Peak Users</h3>
          <div class="value">${maxVUs}</div>
        </div>
        <div class="card">
          <h3>Total Requests</h3>
          <div class="value">${totalRequests.toLocaleString()}</div>
        </div>
        <div class="card">
          <h3>Success Rate</h3>
          <div class="value ${successRate >= 99 ? 'status-pass' : successRate >= 95 ? 'status-warning' : 'status-fail'}">${successRate}%</div>
        </div>
        <div class="card">
          <h3>Slow Requests (&gt;3s)</h3>
          <div class="value ${metrics.slow_responses_3s < 100 ? 'status-pass' : 'status-fail'}">${metrics.slow_responses_3s}</div>
        </div>
        <div class="card">
          <h3>Very Slow (&gt;5s)</h3>
          <div class="value ${metrics.slow_responses_5s < 50 ? 'status-pass' : 'status-fail'}">${metrics.slow_responses_5s}</div>
        </div>
      </div>

      <!-- Breaking Point Analysis -->
      <div class="section">
        <h2>🎯 Breaking Point Analysis</h2>
        <div class="breaking-points">
          <h3>Critical Questions Answered:</h3>
          <ul>
            <li><strong>At what point do response times exceed 3 seconds?</strong><br>
                ${metrics.slow_responses_3s === 0 ? '✅ Never - all requests stayed under 3s' : `⚠️ ${metrics.slow_responses_3s} requests exceeded 3s`}
            </li>
            <li><strong>When do error rates spike above 1%?</strong><br>
                ${errorRate < 1 ? '✅ Never - error rate stayed under 1%' : `⚠️ Error rate reached ${errorRate}%`}
            </li>
            <li><strong>Can the system sustain 200 concurrent users?</strong><br>
                ${errorRate < 1 && durationStats.p95 < 3000 ? '✅ Yes - system is ready!' : errorRate < 5 ? '⚠️ At limits - infrastructure improvements recommended' : '❌ No - urgent improvements needed'}
            </li>
          </ul>
        </div>
      </div>

      <!-- Performance by Stage -->
      <div class="section">
        <h2>📊 Performance by Test Stage</h2>
        <table>
          <thead>
            <tr>
              <th>Stage</th>
              <th>Requests</th>
              <th>Avg (ms)</th>
              <th>P95 (ms)</th>
              <th>P99 (ms)</th>
              <th>Errors</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${stageAnalysisHTML}
          </tbody>
        </table>
      </div>

      <!-- Overall Performance Metrics -->
      <div class="section">
        <h2>📈 Overall Performance Metrics</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Min</th>
              <th>Avg</th>
              <th>P50</th>
              <th>P90</th>
              <th>P95</th>
              <th>P99</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Response Time</strong></td>
              <td>${durationStats.min.toFixed(2)} ms</td>
              <td>${durationStats.avg.toFixed(2)} ms</td>
              <td>${durationStats.p50.toFixed(2)} ms</td>
              <td>${durationStats.p90.toFixed(2)} ms</td>
              <td class="${durationStats.p95 < 3000 ? 'status-pass' : 'status-fail'}">${durationStats.p95.toFixed(2)} ms</td>
              <td class="${durationStats.p99 < 5000 ? 'status-pass' : 'status-fail'}">${durationStats.p99.toFixed(2)} ms</td>
              <td>${durationStats.max.toFixed(2)} ms</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Endpoint Comparison -->
      <div class="section">
        <h2>🔍 Endpoint Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Traffic %</th>
              <th>Count</th>
              <th>Avg (ms)</th>
              <th>P95 (ms)</th>
              <th>P99 (ms)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Browse Products (API 1)</strong></td>
              <td>${((metrics.browse_products.count / totalRequests * 100) || 0).toFixed(1)}%</td>
              <td>${metrics.browse_products.count}</td>
              <td>${browseStats.avg.toFixed(2)}</td>
              <td class="${browseStats.p95 < 3000 ? 'status-pass' : 'status-fail'}">${browseStats.p95.toFixed(2)}</td>
              <td class="${browseStats.p99 < 5000 ? 'status-pass' : 'status-fail'}">${browseStats.p99.toFixed(2)}</td>
              <td class="${browseStats.p95 < 3000 ? 'status-pass' : 'status-fail'}">
                ${browseStats.p95 < 3000 ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td><strong>Search Items (POST)</strong></td>
              <td>${((metrics.search_items.count / totalRequests * 100) || 0).toFixed(1)}%</td>
              <td>${metrics.search_items.count}</td>
              <td>${searchStats.avg.toFixed(2)}</td>
              <td class="${searchStats.p95 < 3000 ? 'status-pass' : 'status-fail'}">${searchStats.p95.toFixed(2)}</td>
              <td class="${searchStats.p99 < 5000 ? 'status-pass' : 'status-fail'}">${searchStats.p99.toFixed(2)}</td>
              <td class="${searchStats.p95 < 3000 ? 'status-pass' : 'status-fail'}">
                ${searchStats.p95 < 3000 ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Test Configuration -->
      <div class="section">
        <h2>⚙️ Test Configuration</h2>
        <table>
          <tbody>
            <tr>
              <td><strong>Test Scenario</strong></td>
              <td>Prime Day / Cyber Monday Preparation</td>
            </tr>
            <tr>
              <td><strong>Phase 1: Ramp to 100</strong></td>
              <td>2 minutes (last year's comfortable zone)</td>
            </tr>
            <tr>
              <td><strong>Phase 2: Ramp to 200</strong></td>
              <td>2 minutes (this year's expected peak)</td>
            </tr>
            <tr>
              <td><strong>Phase 3: CRITICAL Sustain</strong></td>
              <td>3 minutes at 200 users (finding breaking points)</td>
            </tr>
            <tr>
              <td><strong>Phase 4: Ramp Down</strong></td>
              <td>1 minute to observe recovery</td>
            </tr>
            <tr>
              <td><strong>Traffic Distribution</strong></td>
              <td>70% Browse Products, 30% Search Items</td>
            </tr>
            <tr>
              <td><strong>Critical Threshold</strong></td>
              <td>P95 &lt; 3000ms, Error Rate &lt; 1%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Recommendations -->
      <div class="section">
        <h2>💡 Recommendations</h2>
        ${errorRate < 1 && durationStats.p95 < 3000 ? `
          <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-bottom: 10px;">✅ System is Prime Day Ready!</h3>
            <ul style="margin-left: 20px; line-height: 2;">
              <li>All performance thresholds met</li>
              <li>System can handle 200+ concurrent users</li>
              <li>No infrastructure changes required</li>
              <li>Consider monitoring during actual event for anomalies</li>
            </ul>
          </div>
        ` : errorRate < 5 && durationStats.p95 < 5000 ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-bottom: 10px;">⚠️ Infrastructure Improvements Recommended</h3>
            <ul style="margin-left: 20px; line-height: 2;">
              <li>System is at its capacity limits with 200 users</li>
              <li>Consider scaling: Add more server instances</li>
              <li>Optimize database queries (especially for search)</li>
              <li>Implement caching for product listings</li>
              <li>Set up load balancing if not already configured</li>
            </ul>
          </div>
        ` : `
          <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
            <h3 style="color: #721c24; margin-bottom: 10px;">❌ Urgent Infrastructure Changes Needed</h3>
            <ul style="margin-left: 20px; line-height: 2;">
              <li><strong>CRITICAL:</strong> System cannot sustain 200 concurrent users</li>
              <li>Immediate action required before Prime Day</li>
              <li>Scale up server resources (CPU, memory)</li>
              <li>Optimize or scale database</li>
              <li>Implement aggressive caching strategy</li>
              <li>Consider CDN for static content</li>
              <li>Review and optimize slow endpoints identified above</li>
            </ul>
          </div>
        `}
      </div>
    </div>

    <div class="footer">
      <p>Generated with k6 Stress Testing Tool | Prime Day / Cyber Monday Preparation</p>
      <p style="margin-top: 5px;">Test completed at ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;

// Write HTML file
fs.writeFileSync(htmlPath, html);

console.log('\n' + '='.repeat(80));
console.log('🔥 STRESS TEST REPORT GENERATED!');
console.log('='.repeat(80));
console.log(`📊 Report Location: ${htmlPath}`);
console.log(`📈 Total Requests: ${totalRequests}`);
console.log(`⏱️  Test Duration: ${testDuration} seconds`);
console.log(`👥 Peak Virtual Users: ${maxVUs}`);
console.log(`✓  Success Rate: ${successRate}%`);
console.log(`❌ Error Rate: ${errorRate}%`);
console.log(`📉 P95 Response Time: ${durationStats.p95.toFixed(2)} ms`);
console.log(`🐌 Slow Responses (>3s): ${metrics.slow_responses_3s}`);
console.log('='.repeat(80));
console.log(`\n${verdictIcon} ${verdict}\n`);
console.log(`Open the report in your browser:`);
console.log(`  file://${htmlPath}`);
console.log('');
