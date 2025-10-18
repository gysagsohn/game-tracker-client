/**
 * Centralized token storage utility
 * Provides a single source of truth for JWT token management
 * Makes it easier to migrate to different storage methods in the future
 */

const TOKEN_KEY = "token";

export const tokenStorage = {
  /**
   * Get the current JWT token from localStorage
   * Returns null if no token exists
   */
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Save a JWT token to localStorage
   * @param {string} token - The JWT token to store
   */
  set(token) {
    if (!token) {
      console.warn("tokenStorage.set: Attempted to set empty token");
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Remove the JWT token from localStorage
   * Used during logout or when token becomes invalid
   */
  remove() {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Check if a token exists in storage
   * @returns {boolean}
   */
  exists() {
    return !!this.get();
  },
};