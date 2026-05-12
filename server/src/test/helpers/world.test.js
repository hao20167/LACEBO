import { validateWorldData, formatWorldSlug } from '../../helpers/world.js';

describe('World Helper Unit Tests', () => {
  test('validateWorldData - Trả về lỗi nếu tên rỗng', () => {
    const result = validateWorldData({ name: '' });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Name is required');
  });

  test('formatWorldSlug - Chuyển tên thành slug', () => {
    expect(formatWorldSlug('Thế Giới 1')).toBe('the-gioi-1');
  });
});
