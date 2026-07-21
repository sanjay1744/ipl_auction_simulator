import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen glow-mesh text-slate-100 flex items-center justify-center p-6">
      <div class="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
        
        <!-- Header -->
        <div class="text-center flex flex-col items-center gap-2">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-rose-500/20 mb-2">
            IPL
          </div>
          <h2 class="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {{ isLogin() ? 'Welcome Back' : 'Create Account' }}
          </h2>
          <p class="text-xs text-slate-400">
            {{ isLogin() ? 'Enter your details to join the auction room' : 'Sign up to host or join live IPL auctions' }}
          </p>
        </div>

        <!-- Mode Selector Switch -->
        <div class="grid grid-cols-2 bg-slate-950/60 p-1 rounded-xl border border-slate-850 text-xs font-semibold">
          <button 
            type="button"
            (click)="isLogin.set(true)"
            [class]="isLogin() ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
            class="py-2 rounded-lg transition-all text-center">
            Sign In
          </button>
          <button 
            type="button"
            (click)="isLogin.set(false)"
            [class]="!isLogin() ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
            class="py-2 rounded-lg transition-all text-center">
            Register
          </button>
        </div>

        <!-- Error Banner -->
        <div *ngIf="errorMessage()" class="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-400 flex items-center gap-2">
          <span class="material-icons text-base">error_outline</span>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          <div *ngIf="!isLogin()" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-300">Manager / User Name</label>
            <input 
              type="text" 
              [(ngModel)]="name" 
              name="name" 
              placeholder="e.g. Shah Rukh Khan"
              required
              class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-300">Email Address</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email" 
              placeholder="name@example.com"
              required
              class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-300">Password</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password" 
              placeholder="••••••••"
              required
              class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
            />
          </div>

          <button 
            type="submit" 
            [disabled]="isLoading()"
            class="mt-2 w-full py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-2">
            <span *ngIf="isLoading()" class="material-icons animate-spin text-sm">refresh</span>
            <span>{{ isLogin() ? 'Sign In' : 'Create Account' }}</span>
          </button>
        </form>

        <!-- Footer link -->
        <div class="text-center text-xs text-slate-500">
          By signing in, you agree to IPL Auction Game rules.
        </div>
      </div>
    </div>
  `
})
export class AuthComponent {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public isLogin = signal(true);
  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);

  public name = '';
  public email = '';
  public password = '';

  onSubmit(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    if (this.isLogin()) {
      this.apiService.post<any>('auth/login', {
        email: this.email,
        password: this.password
      }).subscribe({
        next: (res) => {
          this.apiService.setSession(res);
          this.isLoading.set(false);
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Login failed. Please check credentials.');
        }
      });
    } else {
      this.apiService.post<any>('auth/register', {
        name: this.name,
        email: this.email,
        password: this.password
      }).subscribe({
        next: (res) => {
          this.apiService.setSession(res);
          this.isLoading.set(false);
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed.');
        }
      });
    }
  }
}
