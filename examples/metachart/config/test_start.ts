for (const data of input) {
  test(`[[TEST_CASE_NAME_MATCHER]]`, async ({ page, context }) => {
      const uniqueIndex = "_" + faker.string.alphanumeric(10)
      
      await page.goto(process.env.BASE_URL);