import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://pixlr.com/');
  await page.getByRole('link', { name: 'AI Photo Editor Open AI Photo' }).click();
  await page.locator('.announce-close').getByRole('img').click();
  await page.locator('#splash-file-menu').getByRole('img').click();
  await page.getByText('Find template').click();
  await page.locator('div').filter({ hasText: /^Positive Affirmation15 Templates$/ }).first().click();
  await page.getByRole('img', { name: 'Positive Your Only Limit Is' }).click();
  await expect(page.locator('body')).toContainText('Positive Your Only Limit Is Your Mind');
  await page.getByText('Use Template').click();
  await expect(page.getByRole('heading', { name: 'Frame' })).toBeVisible();
  await expect(page.locator('#arrange-has-layer').getByText('Name')).toBeVisible();
  await expect(page.locator('#arrange-opacity').getByText('Opacity')).toBeVisible();
  await expect(page.locator('#arrange-frame').getByText('Shape')).toBeVisible();
  await page.locator('#menu-text div').click();
  await page.getByText('Add new textNew default text').click();
  await page.locator('#arrange-name').click();
  await page.locator('#arrange-name').fill('Nice Template');
  await page.getByText('Close').click();
});