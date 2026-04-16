import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../../store/auth.store';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();

  if (token) {
    const reqComToken = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(reqComToken);
  }

  return next(req);
};
