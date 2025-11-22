import { useCallback, useRef } from 'react';
import { sanitizeForSpeech } from '../utils/sanitization';

/**
 * useAudioPlayer Hook
 * Manages Web Speech Synthesis API for English pronunciation
 *
 * @returns {Object} { playAudio, stopAudio, isPlaying }
 *   - playAudio(text): Plays the provided text as speech
 *   - stopAudio(): Cancels current playback
 *   - isPlaying: Boolean indicating if audio is currently playing
 */
export function useAudioPlayer() {
  const utteranceRef = useRef(null);

  /**
   * Plays text as speech using Web Speech Synthesis
   * - Sanitizes input to prevent XSS
   * - Stops any existing playback before starting new
   * - Sets lang to en-US for English pronunciation
   *
   * @param {string} text - The English text to pronounce
   */
  const playAudio = useCallback((text) => {
    if (!text) return;

    // Sanitize text to prevent injection attacks
    const sanitizedText = sanitizeForSpeech(text);
    if (!sanitizedText) return;

    // Stop any existing playback
    stopAudio();

    // Create and configure utterance
    const utterance = new SpeechSynthesisUtterance(sanitizedText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for clarity

    utteranceRef.current = utterance;

    // Play the audio
    window.speechSynthesis.speak(utterance);
  }, []);

  /**
   * Stops current audio playback
   */
  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
  }, []);

  /**
   * Checks if audio is currently playing
   * @returns {boolean} True if speech synthesis is currently speaking
   */
  const isPlaying = window.speechSynthesis.speaking;

  return { playAudio, stopAudio, isPlaying };
}
