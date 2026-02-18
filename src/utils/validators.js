
export function isEmail(value = "") {
  const v = String(value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Strict: use for Signup
export function validatePasswordStrict(value = "") {
  const v = String(value);
  if (v !== v.trim()) return { ok: false, message: "Password must not start or end with spaces." };
  if (/\s/.test(v)) return { ok: false, message: "Password must not contain spaces." };
  if (v.length < 8) return { ok: false, message: "At least 8 characters required." };
  if (!/[A-Za-z]/.test(v)) return { ok: false, message: "Include at least one letter." };
  if (!/[0-9]/.test(v)) return { ok: false, message: "Include at least one number." };
  if (!/[^A-Za-z0-9]/.test(v)) return { ok: false, message: "Include at least one symbol." };
  return { ok: true };
}

// Login: prevent common mistakes, don't block legacy pw formats
export function validatePasswordLogin(value = "") {
  const v = String(value);
  if (v.trim().length === 0) return { ok: false, message: "Password is required." };
  if (v !== v.trim()) return { ok: false, message: "Password must not start or end with spaces." };
  if (/\s/.test(v)) return { ok: false, message: "Password must not contain spaces." };
  return { ok: true };
}

// Simple strength score 0-3
export function passwordStrength(value = "") {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Za-z]/.test(value) && /[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const label = ["Weak", "Weak", "Medium", "Strong"][score];
  return { score, label };
}

// NEW: Game name validation
export function validateGameName(value = "") {
  const v = String(value).trim();
  if (!v) return { ok: false, message: "Game name is required." };
  if (v.length < 2) return { ok: false, message: "Game name must be at least 2 characters." };
  if (v.length > 100) return { ok: false, message: "Game name must be less than 100 characters." };
  return { ok: true };
}

// NEW: Player count validation
export function validatePlayerCount(min, max) {
  const minNum = Number(min);
  const maxNum = Number(max);
  
  if (!min || minNum < 1) {
    return { ok: false, field: "minPlayers", message: "Minimum players must be at least 1." };
  }
  if (!max || maxNum < 1) {
    return { ok: false, field: "maxPlayers", message: "Maximum players must be at least 1." };
  }
  if (minNum > maxNum) {
    return { ok: false, field: "minPlayers", message: "Minimum players cannot exceed maximum players." };
  }
  if (maxNum > 100) {
    return { ok: false, field: "maxPlayers", message: "Maximum players cannot exceed 100." };
  }
  
  return { ok: true };
}

// NEW: Match validation
// src/utils/validators.js - UPDATE validateMatch function

// NEW: Match validation
  export function validateMatch({ game, players }) {
    const errors = {};
    
    if (!game) {
      errors.game = "Please select a game.";
    }
    
    if (!players || players.length < 2) {
      errors.players = "Add at least 2 players to the match.";
    }
    
    if (players && players.length >= 2) {
      const allHaveResults = players.every(p => p.result);
      if (!allHaveResults) {
        errors.results = "All players must have a result (Win/Loss/Draw).";
      }
    }
    
    return {
      ok: Object.keys(errors).length === 0,
      errors
    };
  }

// NEW: Name validation (first/last)
export function validateName(value = "", fieldName = "Name") {
  const v = String(value).trim();
  if (!v) return { ok: false, message: `${fieldName} is required.` };
  if (v.length < 2) return { ok: false, message: `${fieldName} must be at least 2 characters.` };
  if (v.length > 50) return { ok: false, message: `${fieldName} must be less than 50 characters.` };
  if (!/^[a-zA-Z\s'-]+$/.test(v)) return { ok: false, message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes.` };
  return { ok: true };
}