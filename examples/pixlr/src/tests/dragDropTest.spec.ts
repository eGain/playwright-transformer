import { expect, test } from '@playwright/test';
import input from '@data/dragDropTest.json' assert { type: 'json' }
import { faker } from '@faker-js/faker';
import path from 'path';

for (const data of input) {
  test(`test ${data['tcName']}`, async ({ page }) => {
      const uniqueIndex = "_" + faker.string.alphanumeric(10)
      
      await page.goto(process.env.BASE_URL);
  await page.getByRole('link', { name: 'AI Photo Editor Open AI Photo' }).click();
 await page.locator('.announce-close').getByRole('img').click();
  await page.getByText('Open image').click();
  await page.getByText('Create new').click();
  await page.locator('div').filter({ hasText: /^Social Media Post1080x1080 px$/ }).getByRole('img').click();
  await page.getByText('Create', { exact: true }).click();
  await page.locator('#layer-box-add').getByRole('img').click();
  await page.locator('#add-layer-image').click();
const filePath_1 = path.join(process.cwd(), 'attachments', data.body);
await page.locator('//input[@type="file"]').setInputFiles(filePath_1);
  await page.locator('#layer-box-add').click();
  await page.locator('#add-layer-image').getByRole('img').click();
const filePath_2 = path.join(process.cwd(), 'attachments', data.body_1);
await page.locator('//input[@type="file"]').setInputFiles(filePath_2);
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
}
