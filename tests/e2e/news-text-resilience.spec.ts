import { test, expect } from '@playwright/test';

test('news headlines remain readable when images are unavailable', async ({ page }) => {
  await page.route('https://api.gdeltproject.org/**', async route => {
    const url = route.request().url();
    if (url.includes('/context/context')) {
      return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ articles:[{ context:'Text-only JARVIS brief.' }] }) });
    }
    return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ articles:[
      { title:'Text-only headline one', url:'https://example.test/1', domain:'example.test', sourcecountry:'US' },
      { title:'Text-only headline two', url:'https://example.test/2', domain:'example.test', sourcecountry:'US' }
    ] }) });
  });
  await page.goto('/');
  await expect(page.locator('#newsCards')).toContainText('Text-only headline one');
  await expect(page.locator('#newsCards')).toContainText('Text-only headline two');
  await expect(page.locator('#newsCards .news-read').first()).toContainText('READ SOURCE');
});
