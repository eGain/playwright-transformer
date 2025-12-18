const portalUrl = await page.evaluate("navigator.clipboard.readText()") as string; 
const page1 = await page.context().newPage(); 
await page1.goto(portalUrl.replace('silver', 'base').replace('silver', 'base')); 

