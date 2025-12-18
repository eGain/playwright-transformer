import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://pixlr.com/');
  await page.getByRole('link', { name: 'AI Photo Editor Open AI Photo' }).click();
 await page.locator('.announce-close').getByRole('img').click();
  await page.getByText('Open image').click();
  await page.getByText('Create new').click();
  await page.locator('div').filter({ hasText: /^Social Media Post1080x1080 px$/ }).getByRole('img').click();
  await page.getByText('Create', { exact: true }).click();
  await page.locator('#layer-box-add').getByRole('img').click();
  await page.locator('#add-layer-image').click();
  await page.locator('body').setInputFiles('ClusterOwner.png');
  await page.locator('#layer-box-add').click();
  await page.locator('#add-layer-image').getByRole('img').click();
  await page.locator('body').setInputFiles('GenerateTitle.png');
  await page.locator('.raster').click({
    position: {
      x: 355,
      y: 372
    }
  });
  await page.locator('#layer-list canvas').first().click();
  await page.locator('.raster').click({
    position: {
      x: 411,
      y: 72
    }
  });
  await page.locator('.raster').click({
    position: {
      x: 480,
      y: 84
    }
  });
  await page.locator('#layer-list canvas').first().click();
  await page.getByTitle('Close (ctrl+q)').click();
});