import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

export interface PlayerItem {
  id: string;
  name: string;
  role: string;
  category: string;
  team: string;
  country: string;
  age: number;
  rating: number;
  basePrice: number;
  iplRuns: number;
  iplWickets: number;
  matchesPlayed: number;
  strikeRate: number;
  average: number;
  economy: number;
  fifties?: number;
  hundreds?: number;
  imageUrl?: string;
  description?: string;
}

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#07090E] text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-black">
      
      <!-- Official TATA IPL Header Navigation -->
      <header class="sticky top-0 z-50 bg-[#18358A] shadow-2xl border-b border-[#2445A8] px-6 py-3 flex items-center justify-between">
        
        <!-- Left: Official TATA IPL Logo -->
        <div class="flex items-center gap-4 cursor-pointer" (click)="navigateToHome()">
          <img src="Mode=Dark,_Version=A.webp" alt="TATA IPL Logo" class="h-10 md:h-12 w-auto object-contain drop-shadow-md" />
        </div>

        <!-- Center: Nav Links -->
        <nav class="hidden md:flex items-center gap-8 text-sm font-bold text-white">
          <a (click)="navigateToHome()" class="hover:text-amber-300 transition-colors py-1.5 text-slate-100 tracking-wide cursor-pointer">
            Home
          </a>
          <a (click)="navigateToTeams()" class="hover:text-amber-300 transition-colors py-1.5 text-slate-100 tracking-wide cursor-pointer flex items-center gap-1">
            <span>Teams</span>
          </a>
          <a routerLink="/players" class="text-white border-b-2 border-white font-extrabold py-1.5 tracking-wide cursor-pointer flex items-center gap-1">
            <span>Players</span>
          </a>
        </nav>

        <!-- Right Action: Home / Auction Room -->
        <div class="flex items-center gap-3">
          <button 
            (click)="navigateToHome()" 
            class="px-4 py-2 rounded-lg border border-amber-400/50 bg-amber-400 text-slate-950 text-xs font-black tracking-wider hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer">
            <span>HOST AUCTION</span>
            <span class="material-icons text-sm">gavel</span>
          </button>
        </div>
      </header>

      <!-- Main Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        <!-- Header Banner & Controls -->
        <div class="flex flex-col gap-6 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 p-6 md:p-8 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-md">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-xs font-black text-amber-400 uppercase tracking-widest">IPL 2026 PLAYER MASTER POOL</span>
              </div>
              <h1 class="text-3xl md:text-4xl font-black tracking-tight text-white">
                All Players Catalog
              </h1>
              <p class="text-xs text-slate-400 mt-1">
                Search, filter and inspect TATA IPL 2026 player ratings, career stats and base prices
              </p>
            </div>

            <div class="flex items-center gap-3">
              <div class="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-extrabold text-amber-400 flex items-center gap-2 shadow-inner">
                <span class="material-icons text-sm">groups</span>
                <span>{{ filteredPlayers().length }} / {{ players().length }} Players</span>
              </div>
              <button (click)="refreshPlayers()" class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors" title="Reload Data">
                <span class="material-icons text-sm block">refresh</span>
              </button>
            </div>
          </div>

          <!-- Controls Bar: Search, Role Chips, Team Dropdown, Sort -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            <!-- Search Input -->
            <div class="md:col-span-4 relative">
              <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Search player name, country, team..." 
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <!-- Role Selector Chips -->
            <div class="md:col-span-5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button 
                *ngFor="let roleOpt of roleOptions"
                (click)="selectedRole.set(roleOpt.value)"
                [class]="selectedRole() === roleOpt.value ? 'bg-amber-400 text-slate-950 font-black border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'"
                class="px-3 py-2 rounded-xl border text-[11px] uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer">
                {{ roleOpt.label }}
              </button>
            </div>

            <!-- Team & Sort Dropdowns -->
            <div class="md:col-span-3 flex items-center gap-2">
              <select 
                [(ngModel)]="selectedTeam" 
                class="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold cursor-pointer">
                <option value="ALL">All Teams</option>
                <option *ngFor="let team of teamCodes" [value]="team">{{ team }}</option>
              </select>

              <select 
                [(ngModel)]="sortBy" 
                class="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold cursor-pointer">
                <option value="rating">⭐ Rating</option>
                <option value="basePrice">💰 Price</option>
                <option value="iplRuns">🏏 Runs</option>
                <option value="iplWickets">⚽ Wickets</option>
                <option value="strikeRate">⚡ Strike Rate</option>
              </select>
            </div>

          </div>

        </div>

        <!-- Loading Skeleton -->
        <div *ngIf="isLoading()" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let placeholder of [1, 2, 3, 4, 5, 6]" class="p-6 rounded-2xl bg-slate-900/40 border border-slate-850 animate-pulse flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-slate-800"></div>
              <div class="flex-1 flex flex-col gap-2">
                <div class="h-4 bg-slate-800 rounded w-2/3"></div>
                <div class="h-3 bg-slate-800 rounded w-1/2"></div>
              </div>
            </div>
            <div class="h-20 bg-slate-800 rounded-xl"></div>
          </div>
        </div>

        <!-- No Results Found -->
        <div *ngIf="!isLoading() && filteredPlayers().length === 0" class="flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 border border-slate-850 rounded-3xl gap-3">
          <span class="material-icons text-4xl text-slate-600">person_off</span>
          <h3 class="text-lg font-bold text-slate-300">No players match your filter criteria</h3>
          <p class="text-xs text-slate-500">Try clearing your search query or switching role/team filter choices.</p>
          <button (click)="resetFilters()" class="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors">
            Reset All Filters
          </button>
        </div>

        <!-- Player Cards Grid -->
        <div *ngIf="!isLoading() && visiblePlayers().length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            *ngFor="let player of visiblePlayers()" 
            class="group relative bg-[#090D18] border border-slate-800/90 hover:border-slate-600/90 rounded-3xl p-6 transition-all duration-300 shadow-xl flex flex-col gap-4 hover:-translate-y-1 hover:shadow-2xl">
            
            <!-- Top Section: Photo, Name, Rating -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-4">
                <!-- Player Photo / Avatar -->
                <div class="relative w-16 h-16 rounded-full bg-slate-950 border-2 border-indigo-500/40 p-0.5 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <img 
                    *ngIf="player.imageUrl"
                    [src]="getImageUrl(player.imageUrl)" 
                    [alt]="player.name" 
                    (error)="onPlayerImageError($event)"
                    class="w-full h-full object-cover rounded-full"
                  />
                  <div 
                    class="w-full h-full rounded-full fill-current bg-gradient-to-tr from-indigo-900 to-indigo-700 flex items-center justify-center font-bold text-lg text-indigo-300"
                    [style.display]="player.imageUrl ? 'none' : 'flex'">
                    {{ player.name.charAt(0) }}
                  </div>
                </div>

                <div class="flex flex-col">
                  <h3 class="font-bold text-base text-white group-hover:text-amber-400 transition-colors leading-snug">
                    {{ player.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-slate-400 font-medium">{{ player.country }}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span class="text-xs text-slate-400">{{ player.age || 25 }} yrs</span>
                  </div>
                </div>
              </div>

              <!-- Rating Badge -->
              <div class="px-2.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-900/50 text-xs font-black text-indigo-400 flex items-center gap-1 shadow">
                <span>⭐</span>
                <span>{{ player.rating }}</span>
              </div>
            </div>

            <!-- Role & Category Badges -->
            <div class="flex items-center justify-between gap-2 border-t border-slate-850/80 pt-3">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider" 
                  [class]="player.role === 'Batsman' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
                           player.role === 'Bowler' ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' :
                           player.role === 'AllRounder' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                           'bg-purple-500/10 border border-purple-500/30 text-purple-400'">
                  {{ player.role }}
                </span>

                <span *ngIf="player.team" class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
                  {{ player.team }}
                </span>
              </div>

              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-850 text-slate-400">
                {{ player.category }}
              </span>
            </div>

            <!-- Career Stats Block Grid -->
            <div class="grid grid-cols-3 gap-2 bg-[#050711] rounded-2xl p-3.5 border border-slate-900 text-xs">
              <div class="flex flex-col">
                <span class="text-[10px] uppercase text-slate-500 font-bold">Matches</span>
                <span class="text-xs font-bold text-slate-200">{{ player.matchesPlayed || 0 }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] uppercase text-slate-500 font-bold">IPL Runs</span>
                <span class="text-xs font-bold text-slate-200">{{ player.iplRuns || 0 }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] uppercase text-slate-500 font-bold">Wickets</span>
                <span class="text-xs font-bold text-slate-200">{{ player.iplWickets || 0 }}</span>
              </div>
              <div class="flex flex-col border-t border-slate-900 pt-1.5 mt-1">
                <span class="text-[10px] uppercase text-slate-500 font-bold">Strike Rate</span>
                <span class="text-xs font-bold text-slate-200">{{ player.strikeRate || '0.0' }}</span>
              </div>
              <div class="flex flex-col border-t border-slate-900 pt-1.5 mt-1">
                <span class="text-[10px] uppercase text-slate-500 font-bold">Average</span>
                <span class="text-xs font-bold text-slate-200">{{ player.average || '0.0' }}</span>
              </div>
              <div class="flex flex-col border-t border-slate-900 pt-1.5 mt-1">
                <span class="text-[10px] uppercase text-slate-500 font-bold">Economy</span>
                <span class="text-xs font-bold text-slate-200">{{ player.economy || '0.0' }}</span>
              </div>
            </div>

            <!-- Price & Action Footer -->
            <div class="flex justify-between items-center mt-auto border-t border-slate-850 pt-3">
              <div class="flex flex-col">
                <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Base Price</span>
                <span class="text-sm font-black text-amber-400">{{ formatPrice(player.basePrice) }}</span>
              </div>

              <div class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400">
                #{{ player.id }}
              </div>
            </div>

          </div>
        </div>

        <!-- Load More Button -->
        <div *ngIf="displayLimit() < filteredPlayers().length" class="flex justify-center py-4">
          <button 
            (click)="loadMore()" 
            class="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl flex items-center gap-2 cursor-pointer">
            <span>LOAD MORE PLAYERS ({{ filteredPlayers().length - displayLimit() }} REMAINING)</span>
            <span class="material-icons text-sm">expand_more</span>
          </button>
        </div>

      </main>

      <!-- Footer -->
      <footer class="mt-auto border-t border-slate-850 px-6 py-6 bg-[#05070B] text-center text-xs text-slate-500">
        <p>© 2026 IPL Auction Game - Master Player Roster Data.</p>
      </footer>
    </div>
  `
})
export class PlayersComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  public players = signal<PlayerItem[]>([]);
  public isLoading = signal<boolean>(true);

  public searchQuery = signal<string>('');
  public selectedRole = signal<string>('ALL');
  public selectedTeam = signal<string>('ALL');
  public sortBy = signal<string>('rating');
  public displayLimit = signal<number>(24);

  public roleOptions = [
    { label: 'ALL ROLES', value: 'ALL' },
    { label: 'BATTERS', value: 'Batsman' },
    { label: 'BOWLERS', value: 'Bowler' },
    { label: 'ALL-ROUNDERS', value: 'AllRounder' },
    { label: 'WICKETKEEPERS', value: 'WicketKeeper' }
  ];

  public teamCodes = ['CSK', 'MI', 'RCB', 'KKR', 'RR', 'SRH', 'GT', 'LSG', 'DC', 'PBKS'];

  public filteredPlayers = computed(() => {
    let list = [...this.players()];
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.selectedRole();
    const team = this.selectedTeam();
    const sort = this.sortBy();

    if (query) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.country?.toLowerCase().includes(query) ||
        p.team?.toLowerCase().includes(query) ||
        p.role?.toLowerCase().includes(query)
      );
    }

    if (role !== 'ALL') {
      list = list.filter(p => p.role === role);
    }

    if (team !== 'ALL') {
      list = list.filter(p => p.team?.toUpperCase() === team.toUpperCase());
    }

    list.sort((a, b) => {
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'basePrice') return (b.basePrice || 0) - (a.basePrice || 0);
      if (sort === 'iplRuns') return (b.iplRuns || 0) - (a.iplRuns || 0);
      if (sort === 'iplWickets') return (b.iplWickets || 0) - (a.iplWickets || 0);
      if (sort === 'strikeRate') return (b.strikeRate || 0) - (a.strikeRate || 0);
      return 0;
    });

    return list;
  });

  public visiblePlayers = computed(() => {
    return this.filteredPlayers().slice(0, this.displayLimit());
  });

  ngOnInit(): void {
    this.fetchPlayers();
  }

  public refreshPlayers(): void {
    this.fetchPlayers();
  }

  private fetchPlayers(): void {
    this.isLoading.set(true);
    this.apiService.get<PlayerItem[]>('players').subscribe({
      next: (data) => {
        this.players.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch players:', err);
        this.isLoading.set(false);
      }
    });
  }

  public loadMore(): void {
    this.displayLimit.update(n => n + 24);
  }

  public resetFilters(): void {
    this.searchQuery.set('');
    this.selectedRole.set('ALL');
    this.selectedTeam.set('ALL');
    this.sortBy.set('rating');
    this.displayLimit.set(24);
  }

  public navigateToHome(): void {
    this.router.navigate(['/']);
  }

  public navigateToTeams(): void {
    this.router.navigate(['/teams']);
  }

  public getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `https://ik.imagekit.io/vmoilpdg4/tr:w-150,h-150,fo-face,q-80/${path}`;
  }

  public onPlayerImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.nextElementSibling) {
      (target.nextElementSibling as HTMLElement).style.display = 'flex';
    }
  }

  public formatPrice(price: number): string {
    if (!price) return '₹0';
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(0)} Lakh`;
    }
    return `₹${price.toLocaleString()}`;
  }
}
