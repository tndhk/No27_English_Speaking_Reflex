import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveContentToPool, saveContentToPoolBatch } from '../utils/contentPool';

// Mock the supabase module
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Import after mocking
import { supabase } from '../supabase';

describe('src/utils/contentPool.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveContentToPool()', () => {
    const mockContentId = 'gen_123456_0.789';
    const mockContentData = {
      jp: 'これは例です',
      en: 'This is an example',
      level: 'intermediate',
      job_roles: ['software_engineer'],
      interests: ['technology'],
      grammar_patterns: ['present_simple'],
      contexts: ['business_meeting'],
      created_at: new Date().toISOString(),
      usage_count: 1,
      downvotes: 0,
      generated_by: 'gemini'
    };

    // Success cases (C1 coverage - success branch)
    it('should save content successfully to Supabase', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await saveContentToPool(mockContentId, mockContentData);

      expect(supabase.from).toHaveBeenCalledWith('content_pool');
      expect(mockInsert).toHaveBeenCalledWith({
        id: mockContentId,
        ...mockContentData
      });
    });

    it('should include all content fields in the insert', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await saveContentToPool(mockContentId, mockContentData);

      const callArgs = mockInsert.mock.calls[0][0];
      expect(callArgs.id).toBe(mockContentId);
      expect(callArgs.jp).toBe(mockContentData.jp);
      expect(callArgs.en).toBe(mockContentData.en);
      expect(callArgs.level).toBe(mockContentData.level);
    });

    // Error cases (C1 coverage - error branch)
    it('should throw error when Supabase returns error', async () => {
      const mockError = new Error('Database error');
      const mockInsert = vi.fn().mockResolvedValue({ error: mockError });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await expect(saveContentToPool(mockContentId, mockContentData))
        .rejects
        .toThrow('Database error');
    });

    it('should re-throw caught errors', async () => {
      const mockError = new Error('Connection failed');
      const mockInsert = vi.fn().mockRejectedValue(mockError);
      supabase.from.mockReturnValue({ insert: mockInsert });

      await expect(saveContentToPool(mockContentId, mockContentData))
        .rejects
        .toThrow('Connection failed');
    });

    // Abnormal cases
    it('should handle null contentId', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await saveContentToPool(null, mockContentData);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle empty string contentId', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await saveContentToPool('', mockContentData);
      expect(mockInsert).toHaveBeenCalledWith({
        id: '',
        ...mockContentData
      });
    });

    it('should handle minimal contentData', async () => {
      const minimalData = { jp: 'test' };
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await saveContentToPool(mockContentId, minimalData);
      expect(mockInsert).toHaveBeenCalledWith({
        id: mockContentId,
        ...minimalData
      });
    });

    it('should handle empty contentData object', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await saveContentToPool(mockContentId, {});
      expect(mockInsert).toHaveBeenCalledWith({ id: mockContentId });
    });

    // Boundary cases
    it('should handle very long contentId', async () => {
      const longId = 'a'.repeat(1000);
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await saveContentToPool(longId, mockContentData);
      expect(mockInsert).toHaveBeenCalledWith({
        id: longId,
        ...mockContentData
      });
    });

    it('should handle contentData with many fields', async () => {
      const largeData = {};
      for (let i = 0; i < 100; i++) {
        largeData[`field_${i}`] = `value_${i}`;
      }
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await saveContentToPool(mockContentId, largeData);
      expect(mockInsert).toHaveBeenCalled();
    });

    // Detailed error object handling
    it('should throw detailed error information', async () => {
      const detailedError = {
        code: 'UNIQUE_VIOLATION',
        message: 'Unique constraint violated',
        details: 'id column'
      };
      const mockInsert = vi.fn().mockResolvedValue({ error: detailedError });
      supabase.from.mockReturnValue({ insert: mockInsert });

      await expect(saveContentToPool(mockContentId, mockContentData))
        .rejects
        .toBeDefined();
    });
  });

  describe('saveContentToPoolBatch()', () => {
    const mockItems = [
      {
        contentId: 'gen_1',
        contentData: { jp: 'テスト1', en: 'Test 1' }
      },
      {
        contentId: 'gen_2',
        contentData: { jp: 'テスト2', en: 'Test 2' }
      },
      {
        contentId: 'gen_3',
        contentData: { jp: 'テスト3', en: 'Test 3' }
      }
    ];

    // Success cases
    it('should save all items successfully', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch(mockItems);

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should return correct count for all successful saves', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch(mockItems);

      expect(result.successful + result.failed).toBe(mockItems.length);
    });

    // Partial failure cases (C1 coverage)
    it('should count failed items when some fail', async () => {
      let callCount = 0;
      const mockInsert = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Insert failed'));
        }
        return Promise.resolve({ error: null });
      });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch(mockItems);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should count all failures correctly', async () => {
      const mockInsert = vi.fn().mockRejectedValue(new Error('All failed'));
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch(mockItems);

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(3);
    });

    // Edge cases
    it('should handle empty array', async () => {
      const result = await saveContentToPoolBatch([]);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should handle single item', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch([mockItems[0]]);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle very large batch', async () => {
      const largeItems = Array.from({ length: 100 }, (_, i) => ({
        contentId: `gen_${i}`,
        contentData: { jp: `テスト${i}`, en: `Test ${i}` }
      }));

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch(largeItems);

      expect(result.successful).toBe(100);
      expect(result.failed).toBe(0);
    });

    // Invalid input cases
    it('should handle null input gracefully', async () => {
      // This should error since we can\'t map over null
      try {
        await saveContentToPoolBatch(null);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed items', async () => {
      const malformedItems = [
        { contentId: 'gen_1' }, // missing contentData
        { contentData: { jp: 'test' } } // missing contentId
      ];

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch(malformedItems);

      // Should still process and count
      expect(result.successful + result.failed).toBe(2);
    });

    // Boundary cases for results
    it('should return object with successful and failed properties', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch(mockItems);

      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('failed');
      expect(typeof result.successful).toBe('number');
      expect(typeof result.failed).toBe('number');
    });

    // Ensure Promise.allSettled behavior (all promises resolve)
    it('should not throw even if all items fail', async () => {
      const mockInsert = vi.fn().mockRejectedValue(new Error('All fail'));
      supabase.from.mockReturnValue({ insert: mockInsert });

      // Should not throw, should return results
      const result = await saveContentToPoolBatch(mockItems);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(3);
    });

    it('should handle mixed success and Supabase error responses', async () => {
      let callCount = 0;
      const mockInsert = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.resolve({ error: new Error('DB error') });
        }
        return Promise.resolve({ error: null });
      });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveContentToPoolBatch(mockItems);

      // First and third succeed, second fails
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should continue processing after network timeout', async () => {
      const mockInsert = vi.fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ error: null });

      supabase.from.mockReturnValue({ insert: mockInsert });

      const items = [
        { contentId: 'gen_1', contentData: { jp: 'test1' } },
        { contentId: 'gen_2', contentData: { jp: 'test2' } }
      ];

      const result = await saveContentToPoolBatch(items);

      expect(result.failed).toBe(1);
      expect(result.successful).toBe(1);
    });

    it('should handle items with null values in contentData', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: mockInsert });

      const items = [
        {
          contentId: 'gen_1',
          contentData: { jp: null, en: 'test' }
        }
      ];

      const result = await saveContentToPoolBatch(items);
      expect(result.successful).toBe(1);
    });
  });
});
