export const authClient = {
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  },
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  },
  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user_email");
    }
  },
  setUserEmail: (email: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_email", email);
    }
  },
  getUserEmail: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user_email");
    }
    return null;
  },
  isLoggedIn: () => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("token");
    }
    return false;
  },
};
