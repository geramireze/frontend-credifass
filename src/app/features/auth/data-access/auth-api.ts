import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthTokens, LoginRequest } from './auth.model';

interface RefreshTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  login(credenciales: LoginRequest): Promise<AuthTokens> {
    return firstValueFrom(this.http.post<AuthTokens>(`${this.base}/login`, credenciales));
  }

  logout(): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/logout`, {}));
  }

  refresh(refreshToken: string) {
    return this.http.post<RefreshTokens>(`${this.base}/refresh`, { refreshToken });
  }

  forgotPassword(email: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.post<{ message: string }>(`${this.base}/forgot-password`, { email }),
    );
  }

  resetPassword(token: string, password: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/reset-password`, { token, password }),
    );
  }
}
