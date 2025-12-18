/**
 * Sample test_start.ts content for testing
 */

export const TEST_START_CONTENT = [
  'for (const data of input) {',
  '  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ userCreation, page }) => {',
  '      const uniqueIndex = "_" + faker.string.alphanumeric(10)',
  '      const basePage = new BasePage(page);',
  '      const dateTime = new DateTimeHelper();',
  '      const sendMail = new SendMail();',
  '      const invokeApi = new InvokeApis(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);',
  '      const s3Utils = new S3utils();',
  '      ',
  '      await page.goto(process.env.BASE_URL);',
];
