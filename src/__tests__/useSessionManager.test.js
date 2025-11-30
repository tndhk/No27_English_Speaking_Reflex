import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionManager } from '../hooks/useSessionManager';
import { APP_STATES } from '../constants/appStates';

describe('src/hooks/useSessionManager.js', () => {
  describe('Initial state', () => {
    it('should initialize with DASHBOARD status', () => {
      const { result } = renderHook(() => useSessionManager());
      expect(result.current.status).toBe(APP_STATES.DASHBOARD);
    });

    it('should initialize with empty sessionQueue', () => {
      const { result } = renderHook(() => useSessionManager());
      expect(result.current.sessionQueue).toEqual([]);
    });

    it('should initialize with currentIndex 0', () => {
      const { result } = renderHook(() => useSessionManager());
      expect(result.current.currentIndex).toBe(0);
    });

    it('should initialize with isRevealed false', () => {
      const { result } = renderHook(() => useSessionManager());
      expect(result.current.isRevealed).toBe(false);
    });

    it('should initialize with currentDrill null', () => {
      const { result } = renderHook(() => useSessionManager());
      expect(result.current.currentDrill).toBe(null);
    });

    it('should initialize with sessionProgress 0', () => {
      const { result } = renderHook(() => useSessionManager());
      expect(result.current.sessionProgress).toBe(0);
    });
  });

  describe('startSession()', () => {
    const mockDrills = [
      { id: 1, jp: 'テスト1', en: 'Test 1' },
      { id: 2, jp: 'テスト2', en: 'Test 2' },
      { id: 3, jp: 'テスト3', en: 'Test 3' }
    ];

    // Normal cases
    it('should start session with drills', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      expect(result.current.status).toBe(APP_STATES.DRILL);
      expect(result.current.sessionQueue).toEqual(mockDrills);
      expect(result.current.currentIndex).toBe(0);
    });

    it('should reset isRevealed to false on session start', () => {
      const { result } = renderHook(() => useSessionManager());

      // Reveal first
      act(() => {
        result.current.startSession(mockDrills);
        result.current.toggleReveal();
      });

      expect(result.current.isRevealed).toBe(true);

      // Start new session
      act(() => {
        result.current.startSession(mockDrills);
      });

      expect(result.current.isRevealed).toBe(false);
    });

    it('should set currentDrill to first drill', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      expect(result.current.currentDrill).toEqual(mockDrills[0]);
    });

    it('should call onSessionStart callback', () => {
      const onSessionStart = vi.fn();
      const { result } = renderHook(() =>
        useSessionManager({ onSessionStart })
      );

      act(() => {
        result.current.startSession(mockDrills);
      });

      expect(onSessionStart).toHaveBeenCalledOnce();
    });

    // Abnormal cases (C1 coverage)
    it('should not start session with empty array', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession([]);
      });

      expect(result.current.status).toBe(APP_STATES.DASHBOARD);
      expect(result.current.sessionQueue).toEqual([]);
    });

    it('should not start session with null', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(null);
      });

      expect(result.current.status).toBe(APP_STATES.DASHBOARD);
    });

    it('should not start session with undefined', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(undefined);
      });

      expect(result.current.status).toBe(APP_STATES.DASHBOARD);
    });

    // Single item session (boundary)
    it('should handle single-drill session', () => {
      const { result } = renderHook(() => useSessionManager());
      const singleDrill = [mockDrills[0]];

      act(() => {
        result.current.startSession(singleDrill);
      });

      expect(result.current.sessionQueue).toEqual(singleDrill);
      expect(result.current.sessionProgress).toBe(100); // 1/1 = 100%
    });

    // Large session (boundary)
    it('should handle large session (100 drills)', () => {
      const { result } = renderHook(() => useSessionManager());
      const largeDrills = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        jp: `テスト${i}`,
        en: `Test ${i}`
      }));

      act(() => {
        result.current.startSession(largeDrills);
      });

      expect(result.current.sessionQueue.length).toBe(100);
      expect(result.current.status).toBe(APP_STATES.DRILL);
    });

    // Callback without onSessionStart
    it('should handle missing onSessionStart callback gracefully', () => {
      const { result } = renderHook(() => useSessionManager({}));

      expect(() => {
        act(() => {
          result.current.startSession(mockDrills);
        });
      }).not.toThrow();
    });
  });

  describe('nextDrill()', () => {
    const mockDrills = [
      { id: 1, jp: 'テスト1', en: 'Test 1' },
      { id: 2, jp: 'テスト2', en: 'Test 2' },
      { id: 3, jp: 'テスト3', en: 'Test 3' }
    ];

    // Normal progression
    it('should advance to next drill', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      // Verify initial state
      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.nextDrill();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentDrill).toEqual(mockDrills[1]);
    });

    it('should reset isRevealed when moving to next drill', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
        result.current.toggleReveal();
      });

      expect(result.current.isRevealed).toBe(true);

      act(() => {
        result.current.nextDrill();
      });

      expect(result.current.isRevealed).toBe(false);
    });

    it('should update sessionProgress when advancing', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      expect(result.current.sessionProgress).toBeCloseTo(100 / 3, 1); // ~33.33%

      act(() => {
        result.current.nextDrill();
      });

      expect(result.current.sessionProgress).toBeCloseTo(200 / 3, 1); // ~66.67%

      act(() => {
        result.current.nextDrill();
      });

      expect(result.current.sessionProgress).toBeCloseTo(100, 1); // 100%
    });

    // Last drill - should complete session
    it('should complete session when at last drill', () => {
      const onSessionComplete = vi.fn();
      const { result } = renderHook(() =>
        useSessionManager({ onSessionComplete })
      );

      act(() => {
        result.current.startSession(mockDrills);
      });

      act(() => {
        result.current.nextDrill(); // index 1
      });

      act(() => {
        result.current.nextDrill(); // index 2 (last)
      });

      expect(result.current.currentIndex).toBe(2);

      act(() => {
        result.current.nextDrill(); // Should complete
      });

      expect(result.current.status).toBe(APP_STATES.COMPLETE);
      expect(onSessionComplete).toHaveBeenCalledOnce();
    });

    // Single drill session
    it('should complete after first next call in single-drill session', () => {
      const onSessionComplete = vi.fn();
      const { result } = renderHook(() =>
        useSessionManager({ onSessionComplete })
      );

      act(() => {
        result.current.startSession([mockDrills[0]]);
      });

      expect(result.current.sessionProgress).toBe(100);

      act(() => {
        result.current.nextDrill();
      });

      expect(result.current.status).toBe(APP_STATES.COMPLETE);
    });

    // Edge case: no session started
    it('should handle nextDrill with no active session', () => {
      const { result } = renderHook(() => useSessionManager());

      expect(() => {
        act(() => {
          result.current.nextDrill();
        });
      }).not.toThrow();
    });
  });

  describe('completeSession()', () => {
    it('should set status to COMPLETE', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.completeSession();
      });

      expect(result.current.status).toBe(APP_STATES.COMPLETE);
    });

    it('should call onSessionComplete callback', () => {
      const onSessionComplete = vi.fn();
      const { result } = renderHook(() =>
        useSessionManager({ onSessionComplete })
      );

      act(() => {
        result.current.completeSession();
      });

      expect(onSessionComplete).toHaveBeenCalledOnce();
    });

    it('should handle missing onSessionComplete callback', () => {
      const { result } = renderHook(() => useSessionManager({}));

      expect(() => {
        act(() => {
          result.current.completeSession();
        });
      }).not.toThrow();
    });
  });

  describe('returnToDashboard()', () => {
    const mockDrills = [
      { id: 1, jp: 'テスト1', en: 'Test 1' },
      { id: 2, jp: 'テスト2', en: 'Test 2' }
    ];

    it('should reset status to DASHBOARD', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
        result.current.returnToDashboard();
      });

      expect(result.current.status).toBe(APP_STATES.DASHBOARD);
    });

    it('should clear sessionQueue', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
        result.current.returnToDashboard();
      });

      expect(result.current.sessionQueue).toEqual([]);
    });

    it('should reset currentIndex to 0', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
        result.current.nextDrill();
        result.current.returnToDashboard();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should reset isRevealed to false', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
        result.current.toggleReveal();
        result.current.returnToDashboard();
      });

      expect(result.current.isRevealed).toBe(false);
    });

    it('should set currentDrill to null', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
        result.current.returnToDashboard();
      });

      expect(result.current.currentDrill).toBe(null);
    });
  });

  describe('toggleReveal()', () => {
    const mockDrills = [
      { id: 1, jp: 'テスト1', en: 'Test 1' }
    ];

    it('should toggle isRevealed from false to true', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      expect(result.current.isRevealed).toBe(false);

      act(() => {
        result.current.toggleReveal();
      });

      expect(result.current.isRevealed).toBe(true);
    });

    it('should toggle isRevealed from true to false', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
        result.current.toggleReveal();
      });

      expect(result.current.isRevealed).toBe(true);

      act(() => {
        result.current.toggleReveal();
      });

      expect(result.current.isRevealed).toBe(false);
    });

    it('should allow multiple toggles', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      for (let i = 0; i < 5; i++) {
        const before = result.current.isRevealed;
        act(() => {
          result.current.toggleReveal();
        });
        expect(result.current.isRevealed).toBe(!before);
      }
    });
  });

  describe('setLoading()', () => {
    it('should set status to LOADING', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.setLoading();
      });

      expect(result.current.status).toBe(APP_STATES.LOADING);
    });

    it('should transition from DASHBOARD to LOADING', () => {
      const { result } = renderHook(() => useSessionManager());

      expect(result.current.status).toBe(APP_STATES.DASHBOARD);

      act(() => {
        result.current.setLoading();
      });

      expect(result.current.status).toBe(APP_STATES.LOADING);
    });
  });

  describe('setStatus()', () => {
    it('should set custom status', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.setStatus(APP_STATES.COMPLETE);
      });

      expect(result.current.status).toBe(APP_STATES.COMPLETE);
    });

    it('should allow setting any APP_STATES value', () => {
      const { result } = renderHook(() => useSessionManager());

      const states = [
        APP_STATES.DASHBOARD,
        APP_STATES.LOADING,
        APP_STATES.DRILL,
        APP_STATES.COMPLETE
      ];

      states.forEach(state => {
        act(() => {
          result.current.setStatus(state);
        });
        expect(result.current.status).toBe(state);
      });
    });
  });

  describe('sessionProgress calculation', () => {
    const mockDrills = [
      { id: 1, jp: 'テスト1', en: 'Test 1' },
      { id: 2, jp: 'テスト2', en: 'Test 2' },
      { id: 3, jp: 'テスト3', en: 'Test 3' },
      { id: 4, jp: 'テスト4', en: 'Test 4' }
    ];

    it('should calculate correct progress at start (1/4)', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      expect(result.current.sessionProgress).toBe(25); // 1/4 = 25%
    });

    it('should calculate correct progress at second drill (2/4)', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      act(() => {
        result.current.nextDrill();
      });

      expect(result.current.sessionProgress).toBe(50); // 2/4 = 50%
    });

    it('should calculate correct progress at last drill (4/4)', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      act(() => {
        result.current.nextDrill();
      });

      act(() => {
        result.current.nextDrill();
      });

      act(() => {
        result.current.nextDrill();
      });

      expect(result.current.sessionProgress).toBe(100); // 4/4 = 100%
    });

    it('should return 0 progress with no session', () => {
      const { result } = renderHook(() => useSessionManager());

      expect(result.current.sessionProgress).toBe(0);
    });

    // Boundary case: single item
    it('should return 100 progress with single-item session', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession([mockDrills[0]]);
      });

      expect(result.current.sessionProgress).toBe(100);
    });
  });

  describe('Complex scenarios', () => {
    const mockDrills = [
      { id: 1, jp: 'テスト1', en: 'Test 1' },
      { id: 2, jp: 'テスト2', en: 'Test 2' },
      { id: 3, jp: 'テスト3', en: 'Test 3' }
    ];

    it('should handle complete drill session flow', () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useSessionManager({ onSessionStart: onStart, onSessionComplete: onComplete })
      );

      // Start session
      act(() => {
        result.current.startSession(mockDrills);
      });
      expect(onStart).toHaveBeenCalledOnce();
      expect(result.current.status).toBe(APP_STATES.DRILL);

      // Progress through drills
      act(() => {
        result.current.nextDrill();
      });
      expect(result.current.currentIndex).toBe(1);

      act(() => {
        result.current.nextDrill();
      });
      expect(result.current.currentIndex).toBe(2);

      // Complete
      act(() => {
        result.current.nextDrill();
      });
      expect(onComplete).toHaveBeenCalledOnce();
      expect(result.current.status).toBe(APP_STATES.COMPLETE);
    });

    it('should allow returning to dashboard mid-session', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
      });

      act(() => {
        result.current.nextDrill();
      });

      expect(result.current.currentIndex).toBe(1);

      act(() => {
        result.current.returnToDashboard();
      });

      expect(result.current.status).toBe(APP_STATES.DASHBOARD);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.sessionQueue).toEqual([]);
    });

    it('should handle flip while progressing through drills', () => {
      const { result } = renderHook(() => useSessionManager());

      act(() => {
        result.current.startSession(mockDrills);
        result.current.toggleReveal();
      });

      expect(result.current.isRevealed).toBe(true);

      act(() => {
        result.current.nextDrill();
      });

      // Should be unrevealed after advancing
      expect(result.current.isRevealed).toBe(false);
    });

    it('should handle multiple session starts', () => {
      const { result } = renderHook(() => useSessionManager());

      const drills1 = [{ id: 1, jp: 'A', en: 'A' }];
      const drills2 = [
        { id: 2, jp: 'B', en: 'B' },
        { id: 3, jp: 'C', en: 'C' }
      ];

      act(() => {
        result.current.startSession(drills1);
      });
      expect(result.current.sessionQueue.length).toBe(1);

      act(() => {
        result.current.startSession(drills2);
      });
      expect(result.current.sessionQueue.length).toBe(2);
      expect(result.current.currentIndex).toBe(0);
    });
  });
});
