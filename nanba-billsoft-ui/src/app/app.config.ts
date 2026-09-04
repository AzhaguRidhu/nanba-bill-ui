import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
<<<<<<< HEAD
import { provideHttpClient, withInterceptors } from '@angular/common/http';
=======
import { provideHttpClient } from '@angular/common/http';
>>>>>>> 4fe3bfc885ddd701758cf194cdc59830298fca75
import { routes } from './app.routes';
import { loadingInterceptor } from './loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
<<<<<<< HEAD
    provideHttpClient(withInterceptors([loadingInterceptor]))
=======
    provideHttpClient()
>>>>>>> 4fe3bfc885ddd701758cf194cdc59830298fca75
  ]
};
