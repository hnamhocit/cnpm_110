export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY = "fc_access_token";
const REFRESH_KEY = "fc_refresh_token";

// Chỉ chạy ở trình duyệt. Trên server (SSR) trả về null.
function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export const tokenStorage = {
  getAccessToken: () => read(ACCESS_KEY),
  getRefreshToken: () => read(REFRESH_KEY),

  setTokens({ accessToken, refreshToken }: TokenPair) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_KEY, accessToken);
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
