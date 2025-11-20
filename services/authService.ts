
export interface User {
  email: string;
  name: string;
  domain: string;
}

const STORAGE_KEY = 'crm_auth_user';
const ALLOWED_DOMAINS = ['klugmans.com', 'kmobiletech.com'];

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
    domain: domain
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
