import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc/#/');
  await expect(page.getByRole('heading', { name: 'todos' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'What needs to be done?' })).toBeVisible();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).click();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).fill('Sample Note-1');
  await page.getByRole('textbox', { name: 'What needs to be done?' }).press('Enter');
  await page.getByRole('textbox', { name: 'What needs to be done?' }).click();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).fill('Sample Note-2');
  await page.getByRole('textbox', { name: 'What needs to be done?' }).press('Enter');
  await expect(page.getByText('Sample Note-1')).toBeVisible();
  await expect(page.getByText('Sample Note-2')).toBeVisible();
  await page.getByRole('link', { name: 'Completed' }).click();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).click();
  await page.getByRole('textbox', { name: 'What needs to be done?' }).fill('A new note in completed section');
  await page.getByRole('textbox', { name: 'What needs to be done?' }).press('Enter');
  await page.getByRole('link', { name: 'Active' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Sample Note-2' }).getByLabel('Toggle Todo')).toBeVisible();
  await page.getByRole('listitem').filter({ hasText: 'Sample Note-2' }).getByLabel('Toggle Todo').click();
  await page.getByRole('button', { name: 'Clear completed' }).click();
  await page.getByRole('link', { name: 'Active' }).click();
  await page.getByText('Sample Note-1').click();
  await page.getByRole('button', { name: 'Delete' }).click();
});