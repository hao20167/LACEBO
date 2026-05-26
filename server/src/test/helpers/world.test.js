import { validateWorldData, formatWorldSlug } from '../../helpers/world.js';

describe('World Helper Unit Tests', () => {
  test('validateWorldData - Trả về lỗi nếu tên rỗng', () => {
    const result = validateWorldData({ name: '' });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Name is required');
  });

  test('validateWorldData - Trả về hợp lệ khi có tên', () => {
    const result = validateWorldData({ name: 'Test World' });
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('formatWorldSlug - Chuyển tên thành slug', () => {
    expect(formatWorldSlug('Thế Giới 1')).toBe('the-gioi-1');
  });
});
