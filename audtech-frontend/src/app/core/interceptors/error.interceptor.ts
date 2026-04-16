import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../../store/auth.store';
import { AppStore } from '../../store/app.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router    = inject(Router);
  const authStore = inject(AuthStore);
  const appStore  = inject(AppStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          authStore.logout();
          router.navigate(['/auth/login']);
          break;

        case 403:
          appStore.erro('Você não tem permissão para realizar esta ação.');
          break;

        case 404:
          appStore.erro('Recurso não encontrado.');
          break;

        case 422:
        case 400: {
          const msg = error.error?.message;
          if (Array.isArray(msg)) {
            appStore.erro(msg.join(' | '));
          } else if (typeof msg === 'string') {
            appStore.erro(msg);
          } else {
            appStore.erro('Dados inválidos. Verifique o formulário.');
          }
          break;
        }

        case 409:
          appStore.erro(error.error?.message ?? 'Conflito: registro já existe.');
          break;

        default:
          appStore.erro('Erro inesperado. Tente novamente em instantes.');
          break;
      }

      return throwError(() => error);
    }),
  );
};
