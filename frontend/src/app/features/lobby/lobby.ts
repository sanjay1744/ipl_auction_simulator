import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SignalRService } from '../../core/services/signalr.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen glow-mesh text-slate-100 flex flex-col font-sans p-6">
      
      <!-- Top Header -->
      <div class="max-w-5xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <button (click)="goHome()" class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <span class="material-icons text-sm">arrow_back</span>
          </button>
          <div>
            <span class="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Auction Lobby</span>
            <h1 class="text-xl font-extrabold text-white">{{ room()?.roomName || 'Loading Room...' }}</h1>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-mono font-bold text-amber-400">{{ roomCode }}</span>
          </div>
        </div>
      </div>

      <!-- Main Lobby Content -->
      <div class="max-w-5xl w-full mx-auto flex-1 py-8 grid lg:grid-cols-3 gap-8">
        
        <!-- Left 2 Cols: Status & Participants / Team Setup -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- Team Setup Card (If current user doesn't have a team yet) -->
          <div *ngIf="!room()?.userTeam" class="p-6 rounded-2xl bg-amber-950/20 border border-amber-900/50 flex flex-col gap-4">
            <div class="flex items-center gap-3 text-amber-400 font-bold text-lg">
              <span class="material-icons">shield</span>
              <span>Create Your Franchise Team</span>
            </div>
            <p class="text-xs text-slate-300">
              To participate in bidding, specify your franchise name (e.g. Royal Challengers Bengaluru, Mumbai Indians).
            </p>
            <form (ngSubmit)="joinAndCreateTeam()" class="flex gap-3 mt-2">
              <input 
                type="text" 
                [(ngModel)]="teamName" 
                name="teamName" 
                placeholder="Team Name (e.g. Chennai Super Kings)"
                required
                class="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button 
                type="submit" 
                [disabled]="isJoining()"
                class="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors">
                Register Team
              </button>
            </form>
          </div>

          <!-- Active User Franchise Card -->
          <div *ngIf="room()?.userTeam" class="p-6 rounded-2xl bg-slate-900/50 border border-indigo-500/30 backdrop-blur-sm flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center font-bold text-white text-lg">
                {{ room()?.userTeam?.teamName?.substring(0, 2) }}
              </div>
              <div>
                <div class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Your Team</div>
                <h3 class="text-lg font-bold text-white">{{ room()?.userTeam?.teamName }}</h3>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Purse Budget</span>
              <span class="text-lg font-extrabold text-amber-400">₹{{ formatPrice(room()?.userTeam?.remainingBudget) }}</span>
            </div>
          </div>

          <!-- Participants Grid -->
          <div class="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-sm text-slate-200">Room Members & Teams</h3>
              <span class="text-xs text-slate-400 font-semibold">
                {{ signalrService.participants().length || room()?.participants?.length || 0 }} Members
              </span>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div *ngFor="let p of getParticipantsList()" class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400">
                    {{ p.userName?.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                      {{ p.userName }}
                      <span *ngIf="p.role === 'Host'" class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase">Host</span>
                    </h4>
                    <span class="text-[10px] text-slate-400">{{ p.isConnected ? '🟢 Connected' : '🔴 Offline' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right 1 Col: Host Action & Rules -->
        <div class="flex flex-col gap-6">
          <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-6">
            <h3 class="font-bold text-base text-white border-b border-slate-800 pb-3">Auction Controls</h3>

            <!-- Room Parameters -->
            <div class="flex flex-col gap-3 text-xs">
              <div class="flex justify-between text-slate-400">
                <span>Auction Type:</span>
                <strong class="text-slate-200">{{ room()?.auctionType }}</strong>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Purse Limit:</span>
                <strong class="text-amber-400">₹{{ formatPrice(room()?.budget) }}</strong>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Timer per Player:</span>
                <strong class="text-slate-200">{{ room()?.timer }} seconds</strong>
              </div>
            </div>

            <!-- Start Auction Button for Host -->
            <div *ngIf="room()?.isHost" class="flex flex-col gap-2 pt-4 border-t border-slate-800">
              <button 
                (click)="startAuction()"
                class="w-full py-3.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/10">
                🚀 Start Auction Session
              </button>
              <p class="text-[10px] text-slate-400 text-center">As Host, you can start when teams are ready.</p>
            </div>

            <div *ngIf="!room()?.isHost" class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
              ⏳ Waiting for host <strong>{{ room()?.hostName }}</strong> to start the auction...
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LobbyComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  public readonly signalrService = inject(SignalRService);

  public roomCode = '';
  public room = signal<any | null>(null);
  public teamName = '';
  public isJoining = signal(false);

  constructor() {
    // Automatically redirect when auction starts
    effect(() => {
      if (this.signalrService.auctionStatus() === 'Active') {
        this.router.navigate(['/room', this.roomCode]);
      }
    });
  }

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.params['code'] || '';
    const user = this.apiService.currentUser();
    if (!user) {
      this.router.navigate(['/auth'], { queryParams: { returnUrl: `/lobby/${this.roomCode}` } });
      return;
    }

    this.loadRoomDetails();
    this.signalrService.startConnection(this.roomCode, user.token);
  }

  ngOnDestroy(): void {
    // Keep connection alive for room transition
  }

  private loadRoomDetails(): void {
    this.apiService.get<any>(`rooms/${this.roomCode}`).subscribe({
      next: (data) => {
        this.room.set(data);
        if (data.status === 'Active') {
          this.router.navigate(['/room', this.roomCode]);
        }
      },
      error: (err) => {
        console.error('Error fetching room details:', err);
      }
    });
  }

  public joinAndCreateTeam(): void {
    if (!this.teamName.trim()) return;
    this.isJoining.set(true);

    this.apiService.post<any>(`rooms/${this.roomCode}/join`, {
      teamName: this.teamName.trim()
    }).subscribe({
      next: () => {
        this.isJoining.set(false);
        this.loadRoomDetails();
      },
      error: (err) => {
        this.isJoining.set(false);
        alert(err.error?.message || 'Could not register team.');
      }
    });
  }

  public startAuction(): void {
    this.signalrService.startAuction().catch((err) => {
      console.error('Error starting auction:', err);
    });
  }

  public getParticipantsList(): any[] {
    return this.signalrService.participants().length > 0
      ? this.signalrService.participants()
      : (this.room()?.participants || []);
  }

  public goHome(): void {
    this.router.navigate(['/']);
  }

  public formatPrice(price: number | undefined): string {
    if (!price) return '0.00 Cr';
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Crore`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(0)} Lakh`;
    }
    return price.toLocaleString();
  }
}
