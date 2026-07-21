import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SignalRService } from '../../core/services/signalr.service';

@Component({
  selector: 'app-auction-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen glow-mesh text-slate-100 flex flex-col font-sans">
      
      <!-- Top Navigation Bar -->
      <header class="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button (click)="goHome()" class="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors">
            <span class="material-icons text-sm">home</span>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-rose-500 uppercase tracking-widest animate-pulse">🔴 Live Bidding</span>
              <span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">CODE: {{ roomCode }}</span>
            </div>
            <h1 class="text-base font-extrabold text-white leading-tight">{{ room()?.roomName || 'IPL Auction Room' }}</h1>
          </div>
        </div>

        <!-- User Team Header Summary -->
        <div *ngIf="userTeam()" class="flex items-center gap-6">
          <div class="flex flex-col items-end">
            <span class="text-[10px] text-slate-400 font-bold uppercase">Your Team</span>
            <span class="text-sm font-black text-indigo-400">{{ userTeam()?.teamName }}</span>
          </div>
          <div class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/30 flex flex-col items-end">
            <span class="text-[10px] text-amber-500 font-bold uppercase">Remaining Purse</span>
            <span class="text-base font-black text-amber-400">₹{{ formatPrice(userTeam()?.remainingBudget) }}</span>
          </div>
        </div>
      </header>

      <!-- Main Layout -->
      <main class="flex-1 max-w-7xl w-full mx-auto p-6 grid lg:grid-cols-4 gap-6">
        
        <!-- Column 1: Team Roster & Other Teams (Left Sidebar) -->
        <div class="flex flex-col gap-6">
          
          <!-- Roster Overview Card -->
          <div class="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="font-bold text-sm text-slate-200">Your Squad Roster</h3>
              <span class="text-xs font-bold text-indigo-400">{{ userTeam()?.totalPlayers || 0 }} Players</span>
            </div>

            <!-- Squad Slots Breakdown -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex flex-col">
                <span class="text-[10px] text-slate-500 uppercase font-bold">Indian</span>
                <span class="font-bold text-slate-200">{{ userTeam()?.indianPlayers || 0 }}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex flex-col">
                <span class="text-[10px] text-slate-500 uppercase font-bold">Overseas</span>
                <span class="font-bold text-slate-200">{{ userTeam()?.overseasPlayers || 0 }}</span>
              </div>
            </div>

            <!-- Bought Players List -->
            <div class="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              <div *ngIf="!purchases().length" class="text-center py-6 text-xs text-slate-500 italic">
                No players purchased yet.
              </div>
              <div *ngFor="let p of purchases()" class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span class="font-bold text-slate-200">{{ p.playerName }}</span>
                </div>
                <span class="font-bold text-amber-400">₹{{ formatPrice(p.soldPrice) }}</span>
              </div>
            </div>
          </div>

          <!-- All Teams Purse Table -->
          <div class="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-3">
            <h3 class="font-bold text-xs text-slate-400 uppercase tracking-wider">All Franchise Purses</h3>
            <div class="flex flex-col gap-2">
              <div *ngFor="let team of room()?.teams" class="p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-slate-200">{{ team.teamName }}</span>
                  <div class="text-[10px] text-slate-500">{{ team.totalPlayers }} players</div>
                </div>
                <span class="font-bold text-amber-400">₹{{ formatPrice(team.remainingBudget) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2 & 3: Main Bidding Stage (Center - 2 cols) -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- Auction Stage Area -->
          <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col gap-6 relative overflow-hidden shadow-2xl">
            
            <!-- Glow Accent -->
            <div class="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Active Player Card -->
            <div *ngIf="activePlayer(); else noPlayer" class="flex flex-col gap-6">
              
              <!-- Player Header & Timer -->
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-4">
                  <!-- Avatar -->
                  <div class="relative w-20 h-20">
                    <img 
                      *ngIf="activePlayer().imageUrl" 
                      [src]="getImageUrl(activePlayer().imageUrl)" 
                      [alt]="activePlayer().name"
                      class="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg" 
                    />
                    <div *ngIf="!activePlayer().imageUrl" class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center font-black text-2xl text-white">
                      {{ activePlayer().name.charAt(0) }}
                    </div>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400">
                        {{ activePlayer().role }}
                      </span>
                      <span class="text-xs text-slate-400">{{ activePlayer().country }}</span>
                    </div>
                    <h2 class="text-2xl font-black text-white mt-1">{{ activePlayer().name }}</h2>
                    <span class="text-xs font-semibold text-slate-400">Base Price: ₹{{ formatPrice(activePlayer().basePrice) }}</span>
                  </div>
                </div>

                <!-- Animated Timer Circle -->
                <div class="flex flex-col items-center">
                  <div class="w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-xl shadow-lg transition-colors"
                       [class]="signalrService.timerSeconds() <= 5 ? 'border-rose-500 text-rose-500 animate-bounce' : 'border-amber-400 text-amber-400'">
                    {{ signalrService.timerSeconds() }}s
                  </div>
                  <span class="text-[10px] text-slate-400 font-bold uppercase mt-1">Timer</span>
                </div>
              </div>

              <!-- Player Key Stats Banner -->
              <div class="grid grid-cols-4 gap-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-center">
                <div>
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Rating</span>
                  <span class="text-sm font-bold text-amber-400">⭐ {{ activePlayer().rating }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">IPL Runs</span>
                  <span class="text-sm font-bold text-slate-200">{{ activePlayer().iplRuns || '0' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Wickets</span>
                  <span class="text-sm font-bold text-slate-200">{{ activePlayer().iplWickets || '0' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Strike Rate</span>
                  <span class="text-sm font-bold text-slate-200">{{ activePlayer().strikeRate || '0.0' }}</span>
                </div>
              </div>

              <!-- Current Highest Bid Display Box -->
              <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/40 flex flex-col items-center text-center gap-2 shadow-xl relative overflow-hidden">
                <span class="text-xs font-bold text-amber-500 uppercase tracking-widest">Current Highest Bid</span>
                
                <div class="text-4xl font-black text-white tracking-tight">
                  ₹{{ formatPrice(currentBidAmount()) }}
                </div>

                <div *ngIf="latestBid()" class="flex items-center gap-2 mt-1">
                  <span class="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                    🏆 {{ latestBid()?.teamName }} ({{ latestBid()?.bidderName }})
                  </span>
                </div>
                <div *ngIf="!latestBid()" class="text-xs text-slate-500 italic mt-1">
                  No bids placed yet. Minimum bid: Base Price.
                </div>
              </div>

              <!-- Bidding Actions Panel -->
              <div class="flex flex-col gap-3">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Place Your Bid</span>
                
                <!-- Quick Raise Buttons -->
                <div class="grid grid-cols-3 gap-3">
                  <button 
                    (click)="raiseBid(2000000)"
                    [disabled]="!canBid()"
                    class="py-3 px-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 font-bold text-xs text-amber-400 transition-all disabled:opacity-40 shadow">
                    + 20 Lakhs
                  </button>
                  <button 
                    (click)="raiseBid(5000000)"
                    [disabled]="!canBid()"
                    class="py-3 px-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 font-bold text-xs text-amber-400 transition-all disabled:opacity-40 shadow">
                    + 50 Lakhs
                  </button>
                  <button 
                    (click)="raiseBid(10000000)"
                    [disabled]="!canBid()"
                    class="py-3 px-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 font-bold text-xs text-amber-400 transition-all disabled:opacity-40 shadow">
                    + 1 Crore
                  </button>
                </div>
              </div>
            </div>

            <!-- Fallback state when no player is active -->
            <ng-template #noPlayer>
              <div class="flex flex-col items-center justify-center text-center py-16 gap-4">
                <div class="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400">
                  <span class="material-icons text-3xl">sports_cricket</span>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-white mb-1">
                    {{ signalrService.auctionStatus() === 'Completed' ? 'Auction Completed!' : 'Preparing Next Player...' }}
                  </h3>
                  <p class="text-xs text-slate-400 max-w-sm">
                    {{ signalrService.auctionStatus() === 'Completed' ? 'All players in the pool have been auctioned.' : 'The host or system is preparing the next player for bidding.' }}
                  </p>
                </div>
              </div>
            </ng-template>

          </div>
        </div>

        <!-- Column 4: Activity Log & Live Chat (Right Sidebar) -->
        <div class="flex flex-col gap-6">
          
          <!-- Activity Feed -->
          <div class="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-3 max-h-60 overflow-hidden">
            <h3 class="font-bold text-xs text-slate-400 uppercase tracking-wider">Live Activity Log</h3>
            <div class="flex flex-col gap-2 overflow-y-auto pr-1 text-xs text-slate-300">
              <div *ngFor="let log of signalrService.logs()" class="p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                {{ log }}
              </div>
            </div>
          </div>

          <!-- Room Live Chat -->
          <div class="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-3 flex-1 min-h-[300px]">
            <h3 class="font-bold text-xs text-slate-400 uppercase tracking-wider">Room Chat</h3>
            
            <!-- Messages List -->
            <div class="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 max-h-64">
              <div *ngFor="let chat of signalrService.chatMessages()" class="flex flex-col gap-0.5 text-xs">
                <span class="font-bold text-indigo-400 text-[10px]">{{ chat.userName }}</span>
                <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200">
                  {{ chat.message }}
                </div>
              </div>
            </div>

            <!-- Chat Input -->
            <form (ngSubmit)="sendChat()" class="flex gap-2 mt-auto">
              <input 
                type="text" 
                [(ngModel)]="chatText" 
                name="chatText" 
                placeholder="Type message..." 
                class="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit" 
                class="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                <span class="material-icons text-sm block">send</span>
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  `
})
export class AuctionRoomComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  public readonly signalrService = inject(SignalRService);

  public roomCode = '';
  public room = signal<any | null>(null);
  public userTeam = signal<any | null>(null);
  public purchases = signal<any[]>([]);
  public chatText = '';

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.params['code'] || '';
    const user = this.apiService.currentUser();
    if (!user) {
      this.router.navigate(['/auth'], { queryParams: { returnUrl: `/room/${this.roomCode}` } });
      return;
    }

    this.loadRoomDetails();
    this.signalrService.startConnection(this.roomCode, user.token);
  }

  ngOnDestroy(): void {
    // Stop hub connection when navigating away
  }

  private loadRoomDetails(): void {
    this.apiService.get<any>(`rooms/${this.roomCode}`).subscribe({
      next: (data) => {
        this.room.set(data);
        this.userTeam.set(data.userTeam);

        if (data.currentPlayer) {
          this.signalrService.activePlayer.set(data.currentPlayer);
        }
      },
      error: (err) => {
        console.error('Error loading room:', err);
      }
    });
  }

  public activePlayer(): any {
    return this.signalrService.activePlayer();
  }

  public latestBid(): any {
    return this.signalrService.latestBid();
  }

  public currentBidAmount(): number {
    const bid = this.latestBid();
    if (bid) return bid.bidAmount;
    return this.activePlayer()?.basePrice || 0;
  }

  public canBid(): boolean {
    if (!this.activePlayer()) return false;
    if (!this.userTeam()) return false;
    // Check if user already holds highest bid
    const bid = this.latestBid();
    if (bid && bid.teamId === this.userTeam()?.id) return false;
    return true;
  }

  public raiseBid(increment: number): void {
    const nextAmount = this.currentBidAmount() + increment;
    this.signalrService.placeBid(nextAmount).catch((err) => {
      alert(err || 'Could not place bid.');
    });
  }

  public sendChat(): void {
    if (!this.chatText.trim()) return;
    this.signalrService.sendChatMessage(this.chatText.trim()).then(() => {
      this.chatText = '';
    });
  }

  public getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://ik.imagekit.io/vmoilpdg4/tr:w-150,h-150,fo-face,q-80/${path}`;
  }

  public formatPrice(price: number | undefined): string {
    if (!price) return '0.00 Cr';
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(0)} L`;
    }
    return price.toLocaleString();
  }

  public goHome(): void {
    this.router.navigate(['/']);
  }
}
