import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5281/api';

  public currentUser = signal<UserSession | null>(this.loadStoredUser());

  private loadStoredUser(): UserSession | null {
    try {
      const stored = localStorage.getItem('ipl_auction_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore JSON parse error
    }
    return null;
  }

  public setSession(user: UserSession): void {
    localStorage.setItem('ipl_auction_user', JSON.stringify(user));
    localStorage.setItem('ipl_auction_token', user.token);
    this.currentUser.set(user);
  }

  public clearSession(): void {
    localStorage.removeItem('ipl_auction_user');
    localStorage.removeItem('ipl_auction_token');
    this.currentUser.set(null);
  }

  public getToken(): string | null {
    return localStorage.getItem('ipl_auction_token') || this.currentUser()?.token || null;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { headers: this.getHeaders() });
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
  }
}
