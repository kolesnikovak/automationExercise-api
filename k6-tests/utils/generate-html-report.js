const fs = require('fs');
const path = require('path');

// Read the k6 JSON output
const jsonPath = path.join(__dirname, '../reports/load-test-results.json');
const htmlPath = path.join(__dirname, '../reports/load-test-report.html');

if (!fs.existsSync(jsonPath)) {
  console.error('Error: No test results found. Run the load test first with: npm run perf:load');
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
  check_brands: { count: 0, duration: [] },
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
    
    // Track individual actions
    if (data.type === 'Point' && data.metric === 'http_req_duration' && data.data.tags) {
      const tagName = data.data.tags.name;
      if (tagName === 'BrowseProducts') {
        metrics.browse_products.count++;
        metrics.browse_products.duration.push(data.data.value);
      } else if (tagName === 'SearchItems') {
        metrics.search_items.count++;
        metrics.search_items.duration.push(data.data.value);
      } else if (tagName === 'CheckBrands') {
        metrics.check_brands.count++;
        metrics.check_brands.duration.push(data.data.value);
      }
    }
  } catch (e) {
    // Skip invalid JSON lines
  }
});

// Calculate statistics
function calculateStats(values) {
  if (values.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

const durationStats = calculateStats(metrics.http_req_duration);
const browseStats = calculateStats(metrics.browse_products.duration);
const searchStats = calculateStats(metrics.search_items.duration);
const brandsStats = calculateStats(metrics.check_brands.duration);

const totalChecks = metrics.checks_passed + metrics.checks_failed;
const successRate = totalChecks > 0 ? (metrics.checks_passed / totalChecks * 100).toFixed(2) : 0;

const testDuration = testEndTime && testStartTime 
  ? ((new Date(testEndTime) - new Date(testStartTime)) / 1000).toFixed(0)
  : 'N/A';

const maxVUs = metrics.vus.length > 0 
  ? Math.max(...metrics.vus.map(v => v.value))
  : 0;

const totalRequests = metrics.browse_products.count + metrics.search_items.count + metrics.check_brands.count;

// Generate HTML report
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>k6 Load Test Report - AutomationExercise API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.1em; opacity: 0.9; }
    .content { padding: 30px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .card h3 {
      color: #667eea;
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
      color: #667eea;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
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
      background: #667eea;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85em;
      letter-spacing: 0.5px;
    }
    tr:hover { background: #f5f5f5; }
    .status-pass {
      color: #28a745;
      font-weight: bold;
    }
    .status-fail {
      color: #dc3545;
      font-weight: bold;
    }
    .status-warning {
      color: #ffc107;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
      border-top: 1px solid #e0e0e0;
    }
    .distribution {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }
    .dist-item {
      flex: 1;
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .dist-item .percentage {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
    }
    .dist-item .label {
      color: #666;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Load Test Report</h1>
      <p>AutomationExercise API - Lunch Hour Traffic Simulation</p>
      <p style="margin-top: 10px; font-size: 0.9em;">Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="content">
      <!-- Summary Cards -->
      <div class="summary">
        <div class="card">
          <h3>Test Duration</h3>
          <div class="value">${testDuration}<span class="unit">seconds</span></div>
        </div>
        <div class="card">
          <h3>Total Requests</h3>
          <div class="value">${totalRequests.toLocaleString()}</div>
        </div>
        <div class="card">
          <h3>Peak Virtual Users</h3>
          <div class="value">${maxVUs}</div>
        </div>
        <div class="card">
          <h3>Success Rate</h3>
          <div class="value ${successRate >= 99 ? 'status-pass' : successRate >= 95 ? 'status-warning' : 'status-fail'}">${successRate}%</div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="section">
        <h2>📊 Overall Performance Metrics</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Min</th>
              <th>Avg</th>
              <th>Median (P50)</th>
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
              <td class="${durationStats.p95 < 2000 ? 'status-pass' : 'status-fail'}">${durationStats.p95.toFixed(2)} ms</td>
              <td class="${durationStats.p99 < 5000 ? 'status-pass' : 'status-fail'}">${durationStats.p99.toFixed(2)} ms</td>
              <td>${durationStats.max.toFixed(2)} ms</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Action Distribution -->
      <div class="section">
        <h2>🎯 User Action Distribution</h2>
        <div class="distribution">
          <div class="dist-item">
            <div class="percentage">${((metrics.browse_products.count / totalRequests * 100) || 0).toFixed(1)}%</div>
            <div class="label">Browse Products</div>
            <div style="margin-top: 5px; color: #999; font-size: 0.9em;">${metrics.browse_products.count} requests</div>
          </div>
          <div class="dist-item">
            <div class="percentage">${((metrics.search_items.count / totalRequests * 100) || 0).toFixed(1)}%</div>
            <div class="label">Search Items</div>
            <div style="margin-top: 5px; color: #999; font-size: 0.9em;">${metrics.search_items.count} requests</div>
          </div>
          <div class="dist-item">
            <div class="percentage">${((metrics.check_brands.count / totalRequests * 100) || 0).toFixed(1)}%</div>
            <div class="label">Check Brands</div>
            <div style="margin-top: 5px; color: #999; font-size: 0.9em;">${metrics.check_brands.count} requests</div>
          </div>
        </div>
      </div>

      <!-- Individual Action Metrics -->
      <div class="section">
        <h2>🔍 Performance by Action Type</h2>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Count</th>
              <th>Avg (ms)</th>
              <th>P95 (ms)</th>
              <th>P99 (ms)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Browse Products</strong></td>
              <td>${metrics.browse_products.count}</td>
              <td>${browseStats.avg.toFixed(2)}</td>
              <td>${browseStats.p95.toFixed(2)}</td>
              <td>${browseStats.p99.toFixed(2)}</td>
              <td class="${browseStats.p95 < 2000 ? 'status-pass' : 'status-fail'}">
                ${browseStats.p95 < 2000 ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td><strong>Search Items</strong></td>
              <td>${metrics.search_items.count}</td>
              <td>${searchStats.avg.toFixed(2)}</td>
              <td>${searchStats.p95.toFixed(2)}</td>
              <td>${searchStats.p99.toFixed(2)}</td>
              <td class="${searchStats.p95 < 2000 ? 'status-pass' : 'status-fail'}">
                ${searchStats.p95 < 2000 ? '✓ PASS' : '✗ FAIL'}
              </td>
            </tr>
            <tr>
              <td><strong>Check Brands</strong></td>
              <td>${metrics.check_brands.count}</td>
              <td>${brandsStats.avg.toFixed(2)}</td>
              <td>${brandsStats.p95.toFixed(2)}</td>
              <td>${brandsStats.p99.toFixed(2)}</td>
              <td class="${brandsStats.p95 < 2000 ? 'status-pass' : 'status-fail'}">
                ${brandsStats.p95 < 2000 ? '✓ PASS' : '✗ FAIL'}
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
              <td>Lunch Hour Traffic Simulation</td>
            </tr>
            <tr>
              <td><strong>Ramp-Up Phase</strong></td>
              <td>2 minutes to 50 users</td>
            </tr>
            <tr>
              <td><strong>Sustain Phase</strong></td>
              <td>5 minutes at 50 users</td>
            </tr>
            <tr>
              <td><strong>Ramp-Down Phase</strong></td>
              <td>1 minute to 0 users</td>
            </tr>
            <tr>
              <td><strong>Expected Distribution</strong></td>
              <td>60% Browse, 25% Search, 15% Brands</td>
            </tr>
            <tr>
              <td><strong>Performance Threshold P95</strong></td>
              <td>&lt; 2000 ms</td>
            </tr>
            <tr>
              <td><strong>Performance Threshold P99</strong></td>
              <td>&lt; 5000 ms</td>
            </tr>
            <tr>
              <td><strong>Success Rate Target</strong></td>
              <td>&gt; 99%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary Status -->
      <div class="section" style="background: ${successRate >= 99 && durationStats.p95 < 2000 ? '#d4edda' : successRate >= 95 ? '#fff3cd' : '#f8d7da'};">
        <h2>📋 Test Summary</h2>
        <p style="font-size: 1.1em; line-height: 1.6;">
          <strong>Overall Status:</strong> 
          <span class="${successRate >= 99 && durationStats.p95 < 2000 ? 'status-pass' : successRate >= 95 ? 'status-warning' : 'status-fail'}">
            ${successRate >= 99 && durationStats.p95 < 2000 ? '✓ PASSED' : successRate >= 95 ? '⚠ WARNING' : '✗ FAILED'}
          </span>
        </p>
        <ul style="margin-top: 15px; margin-left: 20px; line-height: 2;">
          <li>Total Iterations: ${metrics.iterations}</li>
          <li>Checks Passed: ${metrics.checks_passed} / ${totalChecks}</li>
          <li>Data Sent: ${(metrics.data_sent / 1024).toFixed(2)} KB</li>
          <li>Data Received: ${(metrics.data_received / 1024).toFixed(2)} KB</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>Generated with k6 Performance Testing Tool | AutomationExercise API Load Test</p>
      <p style="margin-top: 5px;">For more details, check the console output or JSON results file</p>
    </div>
  </div>
</body>
</html>`;

// Write HTML file
fs.writeFileSync(htmlPath, html);

console.log('\n' + '='.repeat(80));
console.log('✅ HTML Report Generated Successfully!');
console.log('='.repeat(80));
console.log(`📊 Report Location: ${htmlPath}`);
console.log(`📈 Total Requests: ${totalRequests}`);
console.log(`⏱️  Test Duration: ${testDuration} seconds`);
console.log(`👥 Peak Virtual Users: ${maxVUs}`);
console.log(`✓  Success Rate: ${successRate}%`);
console.log(`📉 P95 Response Time: ${durationStats.p95.toFixed(2)} ms`);
console.log('='.repeat(80));
console.log(`\nOpen the report in your browser:`);
console.log(`  file://${htmlPath}`);
console.log('');
