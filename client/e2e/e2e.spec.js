import { expect, request as playwrightRequest, test } from '@playwright/test';

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:3001/api/';
const PASSWORD = 'Password123!';

async function registerApiUser(apiContext, user) {
  const response = await apiContext.post('users/register', {
    data: user,
  });

  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.token).toBeTruthy();
  expect(body.user).toMatchObject({
    username: user.username,
    display_name: user.display_name,
  });

  return body;
}

async function createWorld(apiContext, token, world) {
  const response = await apiContext.post('worlds', {
    data: world,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body).toMatchObject({
    title: world.title,
    description: world.description,
    is_public: 1,
  });

  return body;
}

async function approvePendingMember(apiContext, token, worldId, username) {
  const pendingMembersResponse = await apiContext.get(
    `worlds/${worldId}/members/pending`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  expect(pendingMembersResponse.status()).toBe(200);

  const pendingMembers = await pendingMembersResponse.json();
  const pendingMember = pendingMembers.find((member) => member.username === username);

  expect(pendingMember).toBeDefined();

  const approveResponse = await apiContext.patch(
    `worlds/${worldId}/members/${pendingMember.id}`,
    {
      data: { status: 'approved' },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  expect(approveResponse.status()).toBe(200);
}

async function getProposedEvent(apiContext, token, worldId, title) {
  const response = await apiContext.get(`events/world/${worldId}/proposed`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.status()).toBe(200);

  const events = await response.json();
  const event = events.find((item) => item.title === title);

  expect(event).toBeDefined();

  return event;
}

async function openEvent(apiContext, token, eventId) {
  const response = await apiContext.patch(`events/${eventId}`, {
    data: { status: 'open' },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('open');
}

async function approvePost(apiContext, token, worldId, content) {
  const pendingPostsResponse = await apiContext.get(
    `posts/world/${worldId}/pending`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  expect(pendingPostsResponse.status()).toBe(200);

  const pendingPosts = await pendingPostsResponse.json();
  const pendingPost = pendingPosts.find((post) => post.content === content);

  expect(pendingPost).toBeDefined();

  const approveResponse = await apiContext.patch(
    `posts/${pendingPost.id}/approve`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  expect(approveResponse.status()).toBe(200);
}

async function registerPlayerViaUi(page, user) {
  await page.goto('/register');

  await page.getByLabel('Display Name').fill(user.display_name);
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);

  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/worlds$/);
  await expect(page.getByRole('heading', { name: /explore worlds/i })).toBeVisible();
}

async function searchWorldAndOpen(page, worldTitle) {
  await page.getByPlaceholder('Search worlds by title...').fill(worldTitle);
  await page.getByRole('button', { name: /search/i }).click();

  await expect(page.getByRole('link', { name: worldTitle })).toBeVisible();
  await page.getByRole('link', { name: worldTitle }).click();

  await expect(page.getByRole('heading', { name: worldTitle })).toBeVisible();
}

test('E2.5 happy path: register, join world, propose event, and create post', async ({
  page,
}) => {
  const apiContext = await playwrightRequest.newContext({
    baseURL: API_BASE_URL,
  });

  const runId = Date.now();
  const dev = {
    username: `e25_dev_${runId}`,
    email: `e25_dev_${runId}@example.com`,
    display_name: 'E2.5 Dev',
    password: PASSWORD,
  };
  const player = {
    username: `e25_player_${runId}`,
    email: `e25_player_${runId}@example.com`,
    display_name: 'E2.5 Player',
    password: PASSWORD,
  };
  const worldTitle = `E2.5 World ${runId}`;
  const worldDescription = 'End-to-end test world for E2.5';
  const eventTitle = `E2.5 Event ${runId}`;
  const eventDescription = 'Player proposed event for E2.5';
  const postContent = `E2.5 post content ${runId}`;

  const devAccount = await registerApiUser(apiContext, dev);
  const world = await createWorld(apiContext, devAccount.token, {
    title: worldTitle,
    description: worldDescription,
  });

  try {
    await test.step('Player registers through the UI', async () => {
      await registerPlayerViaUi(page, player);
    });

    await test.step('Player finds the public world and joins it', async () => {
      await searchWorldAndOpen(page, worldTitle);

      await page.getByRole('button', { name: /^join world$/i }).click();

      await expect(
        page.getByText(/successfully joined the world!/i),
      ).toBeVisible();
      await expect(page.getByText(/pending approval/i)).toBeVisible();
    });

    await test.step('Dev approves the player membership', async () => {
      await approvePendingMember(
        apiContext,
        devAccount.token,
        world.id,
        player.username,
      );

      await page.reload();
      await expect(page.getByText('PLAYER', { exact: true })).toBeVisible();
    });

    await test.step('Player proposes a small event', async () => {
      await page.getByRole('button', { name: /^events$/i }).click();
      await page.getByRole('button', { name: /proposed/i }).click();
      await page.getByRole('button', { name: /\+ propose event/i }).click();

      await page.getByPlaceholder('Event title').fill(eventTitle);
      await page.getByPlaceholder('Describe the event...').fill(eventDescription);
      await page.getByRole('button', { name: /submit proposal/i }).click();

      await expect(
        page.getByText(/waiting for dev approval/i),
      ).toBeVisible();
    });

    let event;
    await test.step('Dev opens the proposed event', async () => {
      event = await getProposedEvent(
        apiContext,
        devAccount.token,
        world.id,
        eventTitle,
      );

      await openEvent(apiContext, devAccount.token, event.id);
    });

    await test.step('Player creates a post in the open event', async () => {
      await page.goto(`/events/${event.id}`);
      await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();

      const postResponsePromise = page.waitForResponse((response) => {
        return (
          response.url().includes(`/api/posts/event/${event.id}`) &&
          response.request().method() === 'POST'
        );
      });

      await page.getByPlaceholder('Write a post for this event...').fill(postContent);
      await page.getByRole('button', { name: /^post$/i }).click();

      const postResponse = await postResponsePromise;
      expect(postResponse.status()).toBe(201);

      const postBody = await postResponse.json();
      expect(postBody).toMatchObject({
        event_id: event.id,
        world_id: world.id,
        content: postContent,
        status: 'pending',
      });

      await expect(
        page.getByText(/waiting for dev approval/i),
      ).toBeVisible();
    });

    await test.step('Dev approves the post and player sees it in the event feed', async () => {
      await approvePost(apiContext, devAccount.token, world.id, postContent);

      await page.reload();
      await expect(page.getByText(postContent)).toBeVisible();
    });
  } finally {
    await apiContext.dispose();
  }
});