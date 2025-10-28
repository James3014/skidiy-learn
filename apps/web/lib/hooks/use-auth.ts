import { useMutation } from '@tanstack/react-query';
import { api, setAuthToken, setUserInfo, clearAuthToken, getUserRole, getAccountId } from '../api/client';
import type { LoginRequest, LoginResponse } from '../api/client';
import { useRouter } from 'next/navigation';

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest) => api.login(data),
    onSuccess: (data: LoginResponse) => {
      // 儲存 token 和使用者資訊
      setAuthToken(data.accessToken);
      setUserInfo(data.accountId, data.role);

      // 根據角色導向不同頁面
      if (data.role === 'instructor') {
        router.push('/lessons');
      } else if (data.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  });
}

export function useLogout() {
  const router = useRouter();

  return () => {
    clearAuthToken();
    router.push('/login');
  };
}

export function useCurrentUser() {
  return {
    role: getUserRole(),
    accountId: getAccountId(),
    isAuthenticated: !!getUserRole()
  };
}
