
import { test, expect } from '@playwright/test';

/**
 * WELL-TEGRA CONSOLE: FULL SYSTEM AUTOMATION & RECORDING SUITE
 * This script automates the entire forensic terminal for screen recording.
 */
test('Execute Full System Demonstration', async ({ page }) => {
  // 1. Setup & Initial Access
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000');
  
  // Wait for the system to initialize
  await page.waitForTimeout(2000);

  // 2. Theme Showcase
  const themes = ['CLEAN', 'TECHNICAL', 'HIGH_CONTRAST', 'FORENSIC'];
  for (const theme of themes) {
    await page.getByTestId(`theme-toggle-${theme}`).click();
    await page.waitForTimeout(1500); // Pause for recording to capture the theme shift
  }

  // 3. Unit System Toggle
  await page.getByTestId('unit-toggle').click();
  await page.waitForTimeout(1000);
  await page.getByTestId('unit-toggle').click();
  await page.waitForTimeout(1000);

  // 4. Sidebar Engagement
  const sidebarToggle = page.getByRole('button', { name: 'Toggle sidebar' });
  await sidebarToggle.click();
  await page.waitForTimeout(1000);

  // 5. Module Activation: Ghost Sync
  const ghostSyncToggle = page.getByTestId('module-toggle-ghostSync');
  await ghostSyncToggle.click();
  await page.waitForTimeout(1000);

  // 6. Ghost Sync Operations
  // Trigger Auto Lineup
  await page.getByText('Auto_Lineup').click();
  await page.waitForTimeout(3000); // Wait for the sync animation

  // Run Anomaly Scan
  await page.getByText('Forensic_Scan').click();
  await page.waitForTimeout(2000);

  // Generate AI Forensic Insight
  await page.getByTestId('generate-insight-btn').click();
  await page.waitForTimeout(5000); // Wait for AI generation and reading time
  
  // Dismiss AI Insight
  await page.getByTestId('close-insight-panel').click();
  await page.waitForTimeout(1000);

  // 7. Module Activation: Trauma Node
  const traumaNodeToggle = page.getByTestId('module-toggle-traumaNode');
  await traumaNodeToggle.click();
  await page.waitForTimeout(1000);

  // Interact with Trauma Node
  await page.getByText('OVALITY').click();
  await page.waitForTimeout(1000);
  await page.getByText('CRITICAL').first().click();
  await page.waitForTimeout(2000);

  // 8. Module Activation: Pulse Analyzer
  const pulseAnalyzerToggle = page.getByTestId('module-toggle-pulseAnalyzer');
  await pulseAnalyzerToggle.click();
  await page.waitForTimeout(1000);

  // Scavenge logs
  await page.getByText('Scavenge NDR for Logs').click();
  await page.waitForTimeout(3000);

  // 9. Final Sovereign Audit
  // Scroll to the bottom to see the final protocol
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  // Generate Global Gemini Insight
  await page.getByRole('button', { name: 'Generate Gemini Insight' }).click();
  await page.waitForTimeout(6000); // Long pause for the final synthesis

  // Execute Sovereign Veto (PDF Generation)
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('sovereign-veto-btn').click();
  const download = await downloadPromise;
  
  // Validate the file naming convention
  expect(download.suggestedFilename()).toContain('BRAHAN_AUDIT');
  await page.waitForTimeout(2000);

  // 10. System Shutdown
  await page.getByTestId('power-btn').click();
  await page.waitForTimeout(2000);

  console.log('Full System Demonstration Complete.');
});
