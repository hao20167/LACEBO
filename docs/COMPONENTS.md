# Component Documentation

Tai lieu nay mo ta cac React component/page hien co trong frontend LACEBO, gom props, dependency va vi du usage.

Frontend nam trong `client/src` va duoc render tu `main.jsx` qua:

```jsx
<BrowserRouter>
  <AuthProvider>
    <App />
  </AuthProvider>
</BrowserRouter>
```

## Quy uoc chung

- Page component trong `client/src/pages` hien tai khong nhan props truc tiep.
- Cac page lay du lieu tu `react-router-dom`, `AuthContext` hoac `api` service.
- Component dung `Link`, `Navigate`, `useNavigate`, `useParams` phai nam ben trong `BrowserRouter` hoac router test nhu `MemoryRouter`.
- Component dung `useAuth()` phai nam ben trong `<AuthProvider>`.

## App

**File:** `client/src/App.jsx`

Root component khai bao layout chinh, `Navbar`, `main` container va route table.

### Props

Khong co props.

### Usage

```jsx
import App from './App';

<App />;
```

Trong ung dung that, `App` duoc boc boi `BrowserRouter` va `AuthProvider` o `main.jsx`.

### Routes

| Path | Component | Protected |
| --- | --- | --- |
| `/` | `Home` | No |
| `/login` | `Login` | No |
| `/register` | `Register` | No |
| `/worlds` | `WorldList` | No |
| `/worlds/create` | `CreateWorld` | Yes |
| `/worlds/mine` | `MyWorlds` | Yes |
| `/worlds/:id` | `WorldDetail` | No |
| `/worlds/:id/manage` | `WorldManage` | Yes |
| `/events/:eventId` | `EventDetail` | No, but file chua ton tai trong `client/src/pages` hien tai |

## Navbar

**File:** `client/src/components/Navbar.jsx`

Thanh dieu huong chinh cua app. Hien thi menu khac nhau tuy theo trang thai dang nhap.

### Props

Khong co props.

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `useAuth()` | Lay `user` va `logout` |
| `Link` | Dieu huong den cac route |

### Usage

```jsx
import Navbar from './components/Navbar';

<Navbar />;
```

### Behavior

- Neu chua dang nhap: hien link `Login` va `Register`.
- Neu da dang nhap: hien `Explore Worlds`, `My Worlds`, `Create World`, ten hien thi user va nut `Logout`.
- Nut `Logout` goi ham `logout()` tu `AuthContext`.

## HelloWorld

**File:** `client/src/components/HelloWorld.jsx`

Component demo don gian, dung cho test hoac scaffold.

### Props

Khong co props.

### Usage

```jsx
import HelloWorld from './components/HelloWorld';

<HelloWorld />;
```

## ProtectedRoute

Co hai bien the trong codebase hien tai.

### App-local ProtectedRoute

**File:** `client/src/App.jsx`

Helper component noi bo, dang duoc su dung that trong route table.

#### Props

| Prop | Type | Required | Mo ta |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Yes | Noi dung route can bao ve |

#### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `useAuth()` | Lay `user` va `loading` |
| `Navigate` | Redirect ve `/login` neu chua dang nhap |

#### Usage

```jsx
<Route
  path="/worlds/create"
  element={
    <ProtectedRoute>
      <CreateWorld />
    </ProtectedRoute>
  }
/>
```

#### Behavior

- Neu `loading` la `true`: hien loading screen.
- Neu khong co `user`: redirect ve `/login`.
- Neu co `user`: render `children`.

### Layout ProtectedRoute

**File:** `client/src/components/layout/ProtectedRoute.jsx`

Component guard theo kieu nested route, hien chua duoc import trong `App.jsx`.

#### Props

Khong co props.

#### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `useAuth()` | Lay `isAuthenticated` |
| `useLocation()` | Luu route hien tai vao `state.from` |
| `Navigate` | Redirect ve `/login` |
| `Outlet` | Render route con khi da dang nhap |

#### Usage

```jsx
import ProtectedRoute from './components/layout/ProtectedRoute';

<Route element={<ProtectedRoute />}>
  <Route path="/worlds/create" element={<CreateWorld />} />
  <Route path="/worlds/mine" element={<MyWorlds />} />
</Route>
```

## Home

**File:** `client/src/pages/Home.jsx`

Trang gioi thieu LACEBO va CTA vao danh sach worlds.

### Props

Khong co props.

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `useAuth()` | Kiem tra `user` de an/hien CTA `Get Started` |
| `Link` | Dieu huong den `/worlds` va `/register` |

### Usage

```jsx
<Route path="/" element={<Home />} />
```

## Login

**File:** `client/src/pages/Login.jsx`

Trang dang nhap bang username va password.

### Props

Khong co props.

### Form data

| Field | Type | Required | Mo ta |
| --- | --- | --- | --- |
| `username` | `string` | Yes | Username nguoi dung nhap |
| `password` | `string` | Yes | Mat khau |

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `useAuth().login` | Gui thong tin dang nhap |
| `useNavigate()` | Chuyen den `/worlds` sau khi thanh cong |
| `Link` | Link sang `/register` |

### Usage

```jsx
<Route path="/login" element={<Login />} />
```

### Behavior

- Submit form goi `login(username, password)`.
- Thanh cong: navigate den `/worlds`.
- That bai: hien loi tu `err.response.data.error` hoac fallback `Login failed`.
- Trong luc submit: disable button va hien `Logging in...`.

## Register

**File:** `client/src/pages/Register.jsx`

Trang dang ky tai khoan moi.

### Props

Khong co props.

### Form data

| Field | Type | Required | Validation | Mo ta |
| --- | --- | --- | --- | --- |
| `display_name` | `string` | Yes | HTML `required` | Ten hien thi |
| `username` | `string` | Yes | HTML `required` | Username |
| `email` | `string` | Yes | `type="email"` | Email |
| `password` | `string` | Yes | `minLength={6}` | Mat khau |

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `useAuth().register` | Tao tai khoan va luu session |
| `useNavigate()` | Chuyen den `/worlds` sau khi thanh cong |
| `Link` | Link sang `/login` |

### Usage

```jsx
<Route path="/register" element={<Register />} />
```

### Submit payload

```js
{
  display_name: 'Alice Nguyen',
  username: 'alice',
  email: 'alice@test.com',
  password: 'Password1!'
}
```

### Behavior

- Submit form goi `register(form)`.
- Thanh cong: navigate den `/worlds`.
- That bai: hien loi tu `err.response.data.error` hoac fallback `Registration failed`.
- Trong luc submit: disable button va hien `Creating account...`.

## WorldList

**File:** `client/src/pages/WorldList.jsx`

Trang hien thi va tim kiem danh sach worlds.

### Props

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `api.get('/worlds')` | Lay danh sach worlds |
| `Link` | Dieu huong den world detail va create world |

### Usage

```jsx
<Route path="/worlds" element={<WorldList />} />
```

### API usage

```js
api.get('/worlds');
api.get('/worlds', { params: { search: searchText } });
```

### Expected world shape

```js
{
  id: number,
  title: string,
  description: string | null,
  member_count: number,
  created_at: string
}
```

## CreateWorld

**File:** `client/src/pages/CreateWorld.jsx`

Trang tao world moi. Route hien tai duoc bao ve boi `ProtectedRoute` trong `App.jsx`.

### Props

Khong co props.

### Form data

| Field | Type | Required | Mo ta |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Ten world |
| `description` | `string` | No | Mo ta world |

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `api.post('/worlds')` | Tao world |
| `useNavigate()` | Chuyen den detail world moi |

### Usage

```jsx
<Route
  path="/worlds/create"
  element={
    <ProtectedRoute>
      <CreateWorld />
    </ProtectedRoute>
  }
/>
```

### Submit payload

```js
{
  title: 'A world where Vietnam wins WW3',
  description: 'Premise and background...'
}
```

### Behavior

- Thanh cong: navigate den `/worlds/:id` voi `id` tu response.
- That bai: hien loi tu server hoac fallback `Failed to create world`.

## MyWorlds

**File:** `client/src/pages/MyWorlds.jsx`

Trang hien thi worlds ma user da tham gia. Route hien tai duoc bao ve boi `ProtectedRoute`.

### Props

Khong co props.

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `api.get('/worlds/mine')` | Lay danh sach worlds cua user |
| `Link` | Dieu huong den detail world, create world, explore worlds |

### Usage

```jsx
<Route
  path="/worlds/mine"
  element={
    <ProtectedRoute>
      <MyWorlds />
    </ProtectedRoute>
  }
/>
```

### Expected world shape

```js
{
  id: number,
  title: string,
  description: string | null,
  role: 'dev' | 'citizen' | string,
  member_count: number,
  credits: number
}
```

## WorldDetail

**File:** `client/src/pages/WorldDetail.jsx`

Trang chi tiet world, gom header, lore timeline, events, announcements va leaderboard.

### Props

Khong co props.

### Route params

| Param | Type | Required | Mo ta |
| --- | --- | --- | --- |
| `id` | `string` | Yes | World id tu route `/worlds/:id` |

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `useParams()` | Lay `id` |
| `useAuth()` | Lay `user` de quyet dinh CTA/join |
| `api` | Lay va thay doi du lieu world |
| `Link` | Dieu huong den login, manage, event detail |

### Usage

```jsx
<Route path="/worlds/:id" element={<WorldDetail />} />
```

### API usage

```js
api.get(`/worlds/${id}`);
api.get(`/events/world/${id}`);
api.get(`/posts/world/${id}/announcements`);
api.get(`/worlds/${id}/leaderboard`);
api.post(`/worlds/${id}/join`);
api.post(`/posts/world/${id}/announcements`, { title, content });
api.post(`/events/world/${id}`, eventPayload);
```

### Tabs

| Tab | Noi dung |
| --- | --- |
| `lore` | Timeline tat ca events |
| `events` | Ongoing events, create event, propose small event |
| `announcements` | Danh sach announcement va form tao announcement cho dev |
| `leaderboard` | Bang xep hang citizen |

### Role-based UI

- Chua dang nhap: hien `Login to Join`.
- Dang nhap nhung chua la member: hien `Join World`.
- Membership `pending`: hien `Pending Approval`.
- Member role `dev`: hien link `Manage`, form tao event va announcement.
- Member khong phai dev: co the propose small event.

### Luu y hien trang

`WorldDetail.jsx` dang import `useAuth` tu `../context/AuthContext`, trong khi codebase hien co thu muc `contexts`. Neu component bi loi build, can doi import ve `../contexts/AuthContext` hoac dung hook `../hooks/useAuth.js`.

## WorldManage

**File:** `client/src/pages/WorldManage.jsx`

Trang quan tri world cho dev, gom duyet member, post va event proposal. Route hien tai duoc bao ve boi `ProtectedRoute`.

### Props

Khong co props.

### Route params

| Param | Type | Required | Mo ta |
| --- | --- | --- | --- |
| `id` | `string` | Yes | World id tu route `/worlds/:id/manage` |

### External dependencies

| Dependency | Muc dich |
| --- | --- |
| `useParams()` | Lay `id` |
| `api` | Lay va cap nhat hang doi moderation |
| `Link` | Quay lai world detail |

### Usage

```jsx
<Route
  path="/worlds/:id/manage"
  element={
    <ProtectedRoute>
      <WorldManage />
    </ProtectedRoute>
  }
/>
```

### API usage

```js
api.get(`/worlds/${id}/members/pending`);
api.get(`/posts/world/${id}/pending`);
api.get(`/events/world/${id}/proposed`);
api.patch(`/worlds/${id}/members/${memberId}`, { status });
api.patch(`/posts/${postId}/approve`);
api.patch(`/events/${eventId}`, { status });
```

### Tabs

| Tab | Noi dung |
| --- | --- |
| `members` | Duyet hoac tu choi member request |
| `posts` | Duyet hoac bo qua pending posts |
| `events` | Duyet hoac tu choi small event proposal |

## AuthProvider va useAuth

**Files:**

- `client/src/contexts/AuthContext.jsx`
- `client/src/hooks/useAuth.js`

`AuthProvider` cung cap authentication state cho component tree.

### AuthProvider props

| Prop | Type | Required | Mo ta |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Yes | Component tree can truy cap auth context |

### Context value

| Field | Type | Mo ta |
| --- | --- | --- |
| `user` | `object \| null` | User hien tai |
| `token` | `string \| null` | JWT token |
| `isAuthenticated` | `boolean` | `true` khi co token |
| `isLoading` | `boolean` | Trang thai login/register trong context |
| `login` | `function` | Dang nhap |
| `register` | `function` | Dang ky |
| `logout` | `function` | Dang xuat |

### Usage

```jsx
import { AuthProvider } from './contexts/AuthContext';

<AuthProvider>
  <App />
</AuthProvider>;
```

```jsx
import { useAuth } from '../contexts/AuthContext';

function Example() {
  const { user, logout } = useAuth();
  return user ? <button onClick={logout}>Logout</button> : null;
}
```

### Luu y

Codebase hien co hai cach import `useAuth`:

- `../contexts/AuthContext`
- `@/hooks/useAuth.js`

Nen thong nhat ve mot cach import de giam nham lan.

## Test usage examples

Khi test component co dung router:

```jsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

render(
  <MemoryRouter>
    <Register />
  </MemoryRouter>,
);
```

Khi test component co dung auth context that:

```jsx
render(
  <MemoryRouter>
    <AuthProvider>
      <Navbar />
    </AuthProvider>
  </MemoryRouter>,
);
```

Khi muon isolate component, co the mock `useAuth()` trong Vitest nhu cac test hien co cua `Register`.
