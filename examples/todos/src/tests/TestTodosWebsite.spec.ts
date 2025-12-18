import { expect, test } from '@playwright/test';
import input from '@data/TestTodosWebsite.json' assert { type: 'json' }
import { faker } from '@faker-js/faker';
import path from 'path';

for (const data of input) {
  test(`test ${data['tcName']}`, async ({ page }) => {
      const uniqueIndex = "_" + faker.string.alphanumeric(10)
      
      await page.goto(process.env.BASE_URL);
  await expect(page.getByRole('heading', { name: 'todos' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'What needs to be done?' })).toBeVisible();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).click();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).fill(data.What_needs_to_be_done + uniqueIndex);
  await page.getByRole('textbox', { name: 'What needs to be done?' }).press('Enter');
  await page.getByRole('textbox', { name: 'What needs to be done?' }).click();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).fill(data.What_needs_to_be_done_1 + uniqueIndex);
  await page.getByRole('textbox', { name: 'What needs to be done?' }).press('Enter');
  await expect(page.getByText( data.What_needs_to_be_done + uniqueIndex )).toBeVisible();
  await expect(page.getByText( data.What_needs_to_be_done_1 + uniqueIndex )).toBeVisible();
  await page.getByRole('link', { name: 'Completed' }).click();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).click();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).fill(data.What_needs_to_be_done_2 + uniqueIndex);
  await page.getByRole('textbox', { name: 'What needs to be done?' }).press('Enter');
  await page.getByRole('link', { name: 'Active' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: data.What_needs_to_be_done_1 + uniqueIndex }).getByLabel('Toggle Todo')).toBeVisible();
  await page.getByRole('listitem').filter({ hasText: data.What_needs_to_be_done_1 + uniqueIndex }).getByLabel('Toggle Todo').click();
  await page.getByRole('button', { name: 'Clear completed' }).click();
  await page.getByRole('link', { name: 'Active' }).click();
  await page.getByText( data.What_needs_to_be_done + uniqueIndex ).click();
  await page.getByRole('button', { name: 'Delete' }).click();
   });
}
