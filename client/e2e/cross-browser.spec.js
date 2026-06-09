import { test, expect } from '@playwright/test';

test.describe('LACEBO - Đảm bảo tính tương thích UI/UX Cross-Browser', () => {

  test('Hiển thị giao diện nhất quán và không lỗi Layout trang chủ', async ({ page }) => {
    await page.goto('/');
    
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    await expect(page).toHaveTitle(/LACEBO/i);
    
    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
  });

  test('Kiểm tra tính năng điều hướng mượt mà giữa các trang Public', async ({ page }) => {
    // Đi thẳng tới trang login để kiểm tra liên kết chéo
    await page.goto('/login');
    
    // Tìm liên kết dẫn đến trang Đăng ký bất kể viết hoa hay viết thường
    const registerLink = page.locator('a[href="/register"], a:has-text("Register"), a:has-text("Đăng ký")').first();
    await expect(registerLink).toBeVisible();
    
    // Thực hiện click chuyển trang và đợi URL thay đổi hoàn tất
    await Promise.all([
      page.waitForURL(/\/register/),
      registerLink.click()
    ]);
    
    // Đảm bảo Form đăng ký phản hồi chuẩn xác trên toàn bộ các lõi trình duyệt
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]').first()).toBeVisible();
  });
});