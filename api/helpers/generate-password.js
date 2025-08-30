/**
 * generate-password.js
 *
 * Helper to generate a random password without external libraries
 */

module.exports = {
  friendlyName: 'Generate password',
  description: 'Generate a random password',
  fn: async function () {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}; 