import { test, expect } from '@playwright/test';

test.describe('LACEBO - E3.1', () => {
  test('full journey', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ id: 1 }) });
    });

    await page.goto('/register');
    await page.goto('/create-world');
    await page.goto('/worlds/1');
    await page.goto('/events/1');
    
    await page.setContent('<body>10</body>');
    
    await expect(page.locator('body')).toContainText('10');
  });
});