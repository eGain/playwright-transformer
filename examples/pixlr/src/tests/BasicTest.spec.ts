import { expect, test } from '@playwright/test';
import input from '@data/BasicTest.json' assert { type: 'json' }
import { faker } from '@faker-js/faker';
import path from 'path';

for (const data of input) {
  test(`test ${data['tcName']}`, async ({ page }) => {
      const uniqueIndex = "_" + faker.string.alphanumeric(10)
      
      await page.goto(process.env.BASE_URL);
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
  await page.locator('#arrange-name').fill(data._arrange_name + uniqueIndex);
  await page.getByText('Close').click();
   });
}
