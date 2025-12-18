import { test, expect } from '@playwright/test';

test('test', async ({ page, context }) => {
  await page.goto('https://www.meta-chart.com/');
  await page.getByRole('link', { name: 'Pie Chart' }).nth(1).click({
    button: 'right'
  });
  const page1 = await context.newPage();
  await page1.goto('https://www.meta-chart.com/pie');
  await expect(page1.getByRole('heading', { name: 'Create a Pie Chart' })).toBeVisible();
  await page1.getByRole('radio', { name: 'Gradient Color' }).check();
  await page1.getByRole('tab', { name: 'Data Enter your data' }).click();
  await page1.getByRole('textbox', { name: 'Enter Series name' }).click();
  await page1.getByRole('textbox', { name: 'Enter Series name' }).fill('Series Test1');
  await page1.getByRole('tab', { name: 'Display Create your chart' }).click();
  await expect(page1.getByRole('alert')).toContainText('Error: Please enter data correctly into the data fields!');
});