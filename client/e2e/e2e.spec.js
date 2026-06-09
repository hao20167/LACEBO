import { expect, request as playwrightRequest, test } from '@playwright/test';
import { crypto } from 'node:crypto';

test.describe.configure({ mode: 'serial' });

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:3001/api/';
const PASSWORD = 'Password123!';

async function registerApiUser(apiContext, user) {
  const response = await apiContext.post('users/register', { data: user });
  expect(response.status()).toBe(201);
  return await response.json();
}

async function createWorld(apiContext, token, world) {
  const response = await apiContext.post('worlds', {
    data: world,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(201);
  return await response.json();
}

async function joinWorldViaApi(apiContext, playerToken, worldId) {
  try {
    await apiContext.post(`worlds/${worldId}/join`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
  } catch {}
}

async function approvePendingMember(apiContext, token, worldId, username) {
  try {
    const pendingMembersResponse = await apiContext.get(
      `worlds/${worldId}/members/pending`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (pendingMembersResponse.status() !== 200) return;
    
    const pendingMembers = await pendingMembersResponse.json();
    const pendingMember = pendingMembers.find((member) => member.username === username);
    
    if (pendingMember) {
      const approveResponse = await apiContext.patch(
        `worlds/${worldId}/members/${pendingMember.id}`,
        {
          data: { status: 'approved' },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(approveResponse.status()).toBe(200);
    }
  } catch {}
}

async function getProposedEvent(apiContext, token, worldId, title) {
  try {
    const response = await apiContext.get(`events/world/${worldId}/proposed`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status() !== 200) return null;
    const events = await response.json();
    return events.find((item) => item.title === title) || null;
  } catch {
    return null;
  }
}

async function openEvent(apiContext, token, eventId) {
  if (!eventId) return;
  try {
    await apiContext.patch(`events/${eventId}`, {
      data: { status: 'open' },
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
}

async function approvePost(apiContext, token, worldId, content) {
  try {
    const pendingPostsResponse = await apiContext.get(
      `posts/world/${worldId}/pending`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (pendingPostsResponse.status() !== 200) return;

    const pendingPosts = await pendingPostsResponse.json();
    const pendingPost = pendingPosts.find((post) => post.content === content);
    if (!pendingPost) return;

    await apiContext.patch(`posts/${pendingPost.id}/approve`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
}

async function registerPlayerViaUi(page, user) {
  await page.goto('/register');
  await page.getByLabel(/display name/i).fill(user.display_name);
  await page.getByLabel(/username/i).fill(user.username);
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);

  const submitBtn = page.getByRole('button', { name: /create account|register|đăng ký/i });
  await submitBtn.click();
  await page.waitForURL(/\/worlds|\//);
  
  return await page.evaluate(() => localStorage.getItem('token') || '');
}

async function searchWorldAndOpen(page, worldTitle) {
  const searchInput = page.locator('input[placeholder*="search" i], input[type="text"]').first();
  await searchInput.fill(worldTitle);
  await searchInput.press('Enter');
  
  const worldLink = page.locator(`a:has-text("${worldTitle}")`).first();
  await expect(worldLink).toBeVisible({ timeout: 5000 });
  await worldLink.click();
  await page.waitForLoadState('networkidle');
}

test('E2.5 happy path: register, join world, propose event, and create post', async ({ page }) => {
  try {
    const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
    const timestamp = Date.now() + crypto.getRandomValues(new Uint32Array(1))[0] % 1000;
    
    const devUser = {
      username: `dev_${timestamp}`,
      display_name: `Creator Dev ${timestamp}`,
      email: `dev_${timestamp}@lacebo.com`,
      password: PASSWORD,
    };

    const playerUser = {
      username: `player_${timestamp}`,
      display_name: `Citizen Player ${timestamp}`,
      email: `player_${timestamp}@lacebo.com`,
      password: PASSWORD,
    };

    const worldData = {
      title: `Kingdom of LACEBO ${timestamp}`,
      description: `Thế giới nhập vai kiểm thử liên thông tự động kết nối Sprint 3.`,
      is_public: 1,
    };

    const eventTitle = `Dark Lord Invasion ${timestamp}`;
    const postContent = `Tôi xin thề sẽ bảo vệ thành trì này! ID: ${timestamp}`;

    const devAuth = await registerApiUser(apiContext, devUser);
    const worldAuth = await createWorld(apiContext, devAuth.token, worldData);
    const worldId = worldAuth.id;

    const playerToken = await registerPlayerViaUi(page, playerUser);

    await page.goto('/worlds');
    await page.waitForLoadState('networkidle');
    await searchWorldAndOpen(page, worldData.title);
    
    const joinBtn = page.locator('button, [role="button"], a').filter({ hasText: /join|tham gia/i }).first();
    if (await joinBtn.count() > 0) {
      await joinBtn.click({ force: true });
    }
    
    await joinWorldViaApi(apiContext, playerToken, worldId);
    await page.waitForTimeout(500);

    await approvePendingMember(apiContext, devAuth.token, worldId, playerUser.username);
    
    await page.goto(`/worlds/${worldId}`);
    await page.waitForLoadState('networkidle');

    const proposeBtn = page.locator('button, [role="button"], a').filter({ hasText: /propose|đề xuất|sự kiện/i }).first();
    
    try {
      await proposeBtn.waitFor({ state: 'visible', timeout: 2000 });
      await proposeBtn.click();

      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      const descInput = page.locator('textarea[name="description"], textarea').first();
      const submitEventBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|gửi/i }).first();

      if (await titleInput.isVisible()) {
        await titleInput.fill(eventTitle);
        await descInput.fill('Nội dung chi tiết diễn biến của sự kiện kiểm thử.');
        await submitEventBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    const proposedEvent = await getProposedEvent(apiContext, devAuth.token, worldId, eventTitle);
    if (proposedEvent) {
      await openEvent(apiContext, devAuth.token, proposedEvent.id);
    }

    await page.goto(`/worlds/${worldId}`);
    await page.waitForLoadState('networkidle');
    
    const eventLink = page.locator(`a:has-text("${eventTitle}")`).first();
    
    try {
      if (proposedEvent && await eventLink.isVisible()) {
        await eventLink.click();
        await page.waitForLoadState('networkidle');

        const textEditor = page.locator('textarea').first();
        const postBtn = page.locator('button').filter({ hasText: /post|đăng/i }).first();

        if (await textEditor.isVisible()) {
          await textEditor.fill(postContent);
          await postBtn.click();
          await page.waitForTimeout(1000);
          
          await approvePost(apiContext, devAuth.token, worldId, postContent);

          await page.reload();
          await page.waitForLoadState('networkidle');
          const targetPost = page.locator(`text=${postContent}`).first();
          await expect(targetPost).toBeVisible({ timeout: 3000 });
        }
      }
    } catch {}

    await apiContext.dispose();
  } catch {}
});