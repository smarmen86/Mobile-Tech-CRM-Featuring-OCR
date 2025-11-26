
export type UserRole = 'c-suite' | 'manager' | 'employee';

export interface User {
  email: string;
  name: string;
  domain: string;
  role: UserRole;
}

const STORAGE_KEY = 'crm_auth_user';
const ALLOWED_DOMAINS = ['klugmans.com', 'kmobiletech.com'];

// Role mapping based on email patterns
const getRoleFromEmail = (email: string): UserRole => {
  const lowerEmail = email.toLowerCase();
  
  // Specific user overrides
  if (lowerEmail === 'abe@kmobiletech.com') {
    return 'c-suite';
  }
  
  // C-Suite: CEO, CFO, COO, CTO, owner, executive, president
  if (lowerEmail.match(/(ceo|cfo|coo|cto|owner|executive|president)/)) {
    return 'c-suite';
  }
  // Manager: manager, director, supervisor, lead
  if (lowerEmail.match(/(manager|director|supervisor|lead)/)) {
    return 'manager';
  }
  // Everyone else is employee
  return 'employee';
};

export const login = (email: string): { success: boolean; user?: User; error?: string } => {
  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split('@')[1];

  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return {
      success: false,
      error: 'Access denied. Restricted to authorized domains only.'
    };
  }

  const user: User = {
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0],
    domain: domain,
    role: getRoleFromEmail(normalizedEmail)
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { success: true, user };
  } catch (e) {
    return { success: false, error: 'Failed to save session.' };
  }
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};
