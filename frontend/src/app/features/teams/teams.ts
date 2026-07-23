import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { IPL_FRANCHISES_DATA, TeamFranchise, TeamPlayer } from '../../core/data/teams-data';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#07090E] text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-black">
      
      <!-- Official TATA IPL Header Navigation -->
      <header class="sticky top-0 z-50 bg-[#18358A] shadow-2xl border-b border-[#2445A8] px-6 py-3 flex items-center justify-between">
        
        <!-- Left: Official TATA IPL Logo -->
        <div class="flex items-center gap-4 cursor-pointer" (click)="navigateToHome()">
          <img src="Mode=Dark,_Version=A.webp" alt="TATA IPL Logo" class="h-10 md:h-12 w-auto object-contain drop-shadow-md" />
        </div>

        <!-- Center: Nav Links & Title -->
        <div class="flex items-center gap-8">
          <nav class="hidden md:flex items-center gap-6 text-sm font-bold text-white">
            <a (click)="navigateToHome()" class="hover:text-amber-300 transition-colors py-1.5 text-slate-100 tracking-wide cursor-pointer">
              Home
            </a>
            <a (click)="showAllFranchises()" [class]="showAllGrid() ? 'text-white border-b-2 border-white font-extrabold' : 'text-slate-100 hover:text-amber-300 hover:border-b-2 hover:border-amber-300'" class="transition-colors py-1.5 tracking-wide cursor-pointer flex items-center gap-1">
              <span>Teams</span>
            </a>
            <a (click)="navigateToPlayers()" class="hover:text-amber-300 transition-colors py-1.5 text-slate-100 tracking-wide cursor-pointer flex items-center gap-1">
              <span>Players</span>
            </a>
          </nav>
        </div>

        <!-- Right Action: All Franchises Toggle -->
        <div class="flex items-center gap-3">
          <button 
            (click)="toggleViewMode()" 
            class="px-4 py-2 rounded-lg border border-amber-400/50 bg-amber-400 text-slate-950 text-xs font-black tracking-wider hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer">
            <span>{{ showAllGrid() ? 'SELECT TEAM' : 'ALL FRANCHISES' }}</span>
            <span class="material-icons text-sm">grid_view</span>
          </button>
        </div>
      </header>

      <!-- Main Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        <!-- Quick Franchise Selector Chips -->
        <div class="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-none border-b border-slate-800/60">
          <button 
            (click)="showAllFranchises()"
            [style.background-color]="showAllGrid() ? '#F59E0B' : '#0E121B'"
            [style.border-color]="'#F59E0B'"
            [style.color]="showAllGrid() ? '#000000' : '#E2E8F0'"
            class="px-4 py-2.5 rounded-xl border text-xs font-black tracking-wide uppercase transition-all whitespace-nowrap shadow-md flex items-center gap-2 cursor-pointer hover:scale-105">
            <span class="material-icons text-sm">grid_view</span>
            <span>ALL FRANCHISES</span>
          </button>
          <button 
            *ngFor="let team of franchises"
            (click)="selectTeam(team.code)"
            [style.background-color]="selectedTeamCode() === team.code && !showAllGrid() ? team.primaryColor : '#0E121B'"
            [style.border-color]="team.primaryColor"
            [style.color]="selectedTeamCode() === team.code && !showAllGrid() ? '#000000' : '#E2E8F0'"
            class="px-4 py-2 rounded-xl border text-xs font-black tracking-wide uppercase transition-all whitespace-nowrap shadow-md cursor-pointer flex items-center gap-2 hover:scale-105">
            <img [src]="team.logo" [alt]="team.code" class="w-5 h-5 object-contain rounded-md" />
            <span>{{ team.code }}</span>
          </button>
        </div>

        <!-- VIEW A: ALL FRANCHISES GRID -->
        <section *ngIf="showAllGrid()" class="flex flex-col gap-8 animate-fadeIn">
          
          <!-- Header Title & Live Search Bar -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 p-6 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-md">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span class="text-xs font-black text-amber-400 uppercase tracking-widest">IPL 2026 OFFICIAL TEAMS</span>
              </div>
              <h2 class="text-2xl md:text-3xl font-black tracking-tight text-white">
                Official IPL Franchises
              </h2>
              <p class="text-xs text-slate-400 mt-1">
                Explore squad statistics, star players, team leadership & stadium home grounds
              </p>
            </div>

            <!-- Search Bar -->
            <div class="relative w-full md:w-80">
              <span class="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Search team, captain, city..." 
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <!-- 10 Franchise Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
              *ngFor="let team of filteredFranchises()"
              (click)="selectTeam(team.code)"
              class="group relative bg-[#080C16] border border-slate-800/90 hover:border-amber-400/50 rounded-3xl transition-all duration-500 cursor-pointer shadow-2xl flex flex-col justify-between overflow-hidden hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
              
              <!-- Aesthetic Shaddy Watermark Logo Background Layer -->
              <div class="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 rounded-3xl">
                <img 
                  [src]="team.logo" 
                  [alt]="team.name" 
                  class="absolute -right-8 -bottom-8 w-64 h-64 object-cover rounded-full opacity-20 group-hover:opacity-35 group-hover:scale-115 group-hover:-rotate-6 transition-all duration-700 ease-out filter blur-[1px] brightness-125 contrast-125 saturate-150" 
                />
                <!-- Gradient overlay to keep text crisp and readable -->
                <div class="absolute inset-0 bg-gradient-to-t from-[#070912]/95 via-[#080C16]/80 to-transparent"></div>
              </div>

              <!-- Hero Header Banner with Team Primary Color Gradient -->
              <div 
                class="h-28 w-full relative p-4 flex items-start justify-between overflow-hidden z-10"
                [style.background]="'linear-gradient(135deg, ' + team.primaryColor + 'DD 0%, ' + team.accentColor + 'AA 100%)'">
                
                <!-- Ambient Overlay -->
                <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#080C16]/90"></div>
                
                <!-- Code Badge -->
                <span class="relative z-10 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-slate-950/85 text-white border border-white/20 shadow-md">
                  {{ team.code }}
                </span>

                <!-- Squad Players Count Pill -->
                <span class="relative z-10 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-950/85 text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow-md">
                  <span class="material-icons text-xs">groups</span>
                  <span>{{ team.squad.length }} Players</span>
                </span>
              </div>

              <!-- Floating Hero Logo Emblem Badge -->
              <div class="relative -mt-14 px-6 flex justify-center z-10">
                <div 
                  class="w-24 h-24 rounded-2xl bg-[#080B14] p-2 border-2 shadow-2xl group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden"
                  [style.border-color]="team.primaryColor"
                  [style.box-shadow]="'0 8px 25px ' + team.primaryColor + '40'">
                  <img 
                    [src]="team.logo" 
                    [alt]="team.name" 
                    (error)="onLogoError($event, team.code)"
                    class="w-full h-full object-cover rounded-xl shadow-sm"
                  />
                </div>
              </div>

              <!-- Card Body: Team Info & Leadership -->
              <div class="p-6 pt-4 flex flex-col gap-5 flex-1 justify-between relative z-10">
                
                <!-- Team Name & Title -->
                <div class="text-center flex flex-col items-center gap-1">
                  <h3 class="text-xl font-black uppercase tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    {{ team.name }}
                  </h3>
                  <span class="text-[11px] font-extrabold uppercase tracking-widest opacity-85" [style.color]="team.primaryColor">
                    IPL 2026 FRANCHISE
                  </span>
                </div>

                <!-- Key Leadership Metadata -->
                <div class="grid grid-cols-2 gap-2.5 bg-[#04060E]/85 backdrop-blur-sm rounded-2xl p-4 border border-slate-850 text-xs">
                  <div class="flex flex-col gap-1">
                    <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Captain</span>
                    <span class="font-extrabold text-slate-200 text-xs truncate flex items-center gap-1" [style.color]="team.primaryColor">
                      <span>👑</span>
                      <span class="truncate">{{ team.captain }}</span>
                    </span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Head Coach</span>
                    <span class="font-bold text-slate-300 text-xs truncate flex items-center gap-1">
                      <span>📋</span>
                      <span class="truncate">{{ team.headCoach }}</span>
                    </span>
                  </div>

                  <div class="col-span-2 flex flex-col gap-1 border-t border-slate-800/80 pt-2.5 mt-0.5">
                    <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Home Stadium</span>
                    <span class="text-[11px] font-semibold text-slate-400 truncate flex items-center gap-1">
                      <span>🏟️</span>
                      <span class="truncate">{{ team.homeGround }}</span>
                    </span>
                  </div>
                </div>

                <!-- Footer Action Button -->
                <button 
                  class="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 shadow-lg group-hover:shadow-amber-500/20 group-hover:brightness-110 cursor-pointer"
                  [style.background-color]="team.primaryColor"
                  style="color: #050711;">
                  <span>VIEW SQUAD</span>
                  <span class="material-icons text-sm group-hover:translate-x-1.5 transition-transform">arrow_forward</span>
                </button>

              </div>

            </div>
          </div>
        </section>

        <!-- VIEW B: SELECTED FRANCHISE DETAILS & SQUAD -->
        <section *ngIf="!showAllGrid() && currentTeam()" class="flex flex-col gap-8 animate-fadeIn">
          
          <!-- Franchise Header Banner -->
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#090C13] border-2 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden"
            [style.border-color]="currentTeam()!.primaryColor">
            
            <!-- Background Radial Glow -->
            <div 
              class="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
              [style.background-color]="currentTeam()!.primaryColor">
            </div>

            <!-- Left: Franchise Identity -->
            <div class="flex items-center gap-6 z-10">
              <div 
                class="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#06080D] border-2 flex items-center justify-center p-2 shadow-2xl overflow-hidden"
                [style.border-color]="currentTeam()!.primaryColor">
                <img [src]="currentTeam()!.logo" [alt]="currentTeam()!.name" class="w-full h-full object-cover rounded-xl drop-shadow-md" />
              </div>

              <div class="flex flex-col">
                <span class="text-xs font-bold tracking-widest uppercase opacity-80" [style.color]="currentTeam()!.primaryColor">
                  IPL 2026 FRANCHISE
                </span>
                <h2 class="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 leading-none text-white">
                  {{ currentTeam()!.name }}
                </h2>
              </div>
            </div>

            <!-- Right: 3 Key Metadata Info Cards -->
            <div class="w-full md:w-auto grid grid-cols-1 sm:grid-cols-3 gap-4 z-10">
              
              <!-- Card 1: Captain -->
              <div class="bg-[#06080D] border-2 rounded-2xl p-4 min-w-[170px] flex flex-col justify-center"
                [style.border-color]="currentTeam()!.primaryColor">
                <span class="text-[10px] text-slate-400 font-black tracking-wider uppercase mb-1">
                  CAPTAIN
                </span>
                <span class="text-base font-extrabold text-white">
                  {{ currentTeam()!.captain }}
                </span>
              </div>

              <!-- Card 2: Head Coach -->
              <div class="bg-[#06080D] border-2 rounded-2xl p-4 min-w-[170px] flex flex-col justify-center"
                [style.border-color]="currentTeam()!.primaryColor">
                <span class="text-[10px] text-slate-400 font-black tracking-wider uppercase mb-1">
                  HEAD COACH
                </span>
                <span class="text-base font-extrabold text-white">
                  {{ currentTeam()!.headCoach }}
                </span>
              </div>

              <!-- Card 3: Home Ground -->
              <div class="bg-[#06080D] border-2 rounded-2xl p-4 min-w-[220px] flex flex-col justify-center"
                [style.border-color]="currentTeam()!.primaryColor">
                <span class="text-[10px] text-slate-400 font-black tracking-wider uppercase mb-1">
                  HOME GROUND
                </span>
                <span class="text-sm font-extrabold text-white leading-tight">
                  {{ currentTeam()!.homeGround }}
                </span>
              </div>

            </div>
          </div>

          <!-- Squad Categorized in 3 Distinct Columns -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            <!-- Column 1: BATTERS & WKS -->
            <div class="bg-[#090C13] border-2 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl"
              [style.border-color]="currentTeam()!.primaryColor">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-black uppercase tracking-wider" [style.color]="currentTeam()!.primaryColor">
                    BATTERS & WKS
                  </h3>
                  <span class="w-5 h-5 rounded-full bg-slate-800 text-xs font-bold flex items-center justify-center" [style.color]="currentTeam()!.primaryColor">
                    {{ battersAndWks().length }}
                  </span>
                </div>
              </div>

              <div class="flex flex-col divide-y divide-slate-850/60">
                <div 
                  *ngFor="let p of battersAndWks()" 
                  class="py-3 flex items-center justify-between hover:bg-slate-900/50 px-2 rounded-lg transition-colors group">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                      {{ p.name }}
                    </span>
                    <span *ngIf="p.isCaptain" class="px-1.5 py-0.5 text-[9px] font-black text-slate-950 rounded uppercase"
                      [style.background-color]="currentTeam()!.primaryColor">
                      CAPT
                    </span>
                  </div>
                  <span *ngIf="p.isWk" class="px-2 py-0.5 text-[10px] font-black text-slate-950 rounded uppercase"
                    [style.background-color]="currentTeam()!.primaryColor">
                    WK
                  </span>
                </div>
              </div>
            </div>

            <!-- Column 2: ALL-ROUNDERS -->
            <div class="bg-[#090C13] border-2 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl"
              [style.border-color]="currentTeam()!.primaryColor">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-black uppercase tracking-wider" [style.color]="currentTeam()!.primaryColor">
                    ALL-ROUNDERS
                  </h3>
                  <span class="w-5 h-5 rounded-full bg-slate-800 text-xs font-bold flex items-center justify-center" [style.color]="currentTeam()!.primaryColor">
                    {{ allRounders().length }}
                  </span>
                </div>
              </div>

              <div class="flex flex-col divide-y divide-slate-850/60">
                <div 
                  *ngFor="let p of allRounders()" 
                  class="py-3 flex items-center justify-between hover:bg-slate-900/50 px-2 rounded-lg transition-colors group">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                      {{ p.name }}
                    </span>
                    <span *ngIf="p.isCaptain" class="px-1.5 py-0.5 text-[9px] font-black text-slate-950 rounded uppercase"
                      [style.background-color]="currentTeam()!.primaryColor">
                      CAPT
                    </span>
                  </div>
                  <span *ngIf="p.country !== 'India'" class="text-[10px] text-slate-500 uppercase font-semibold">
                    {{ p.country }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Column 3: BOWLERS -->
            <div class="bg-[#090C13] border-2 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl"
              [style.border-color]="currentTeam()!.primaryColor">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-black uppercase tracking-wider" [style.color]="currentTeam()!.primaryColor">
                    BOWLERS
                  </h3>
                  <span class="w-5 h-5 rounded-full bg-slate-800 text-xs font-bold flex items-center justify-center" [style.color]="currentTeam()!.primaryColor">
                    {{ bowlers().length }}
                  </span>
                </div>
              </div>

              <div class="flex flex-col divide-y divide-slate-850/60">
                <div 
                  *ngFor="let p of bowlers()" 
                  class="py-3 flex items-center justify-between hover:bg-slate-900/50 px-2 rounded-lg transition-colors group">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                      {{ p.name }}
                    </span>
                    <span *ngIf="p.isCaptain" class="px-1.5 py-0.5 text-[9px] font-black text-slate-950 rounded uppercase"
                      [style.background-color]="currentTeam()!.primaryColor">
                      CAPT
                    </span>
                  </div>
                  <span *ngIf="p.country !== 'India'" class="text-[10px] text-slate-500 uppercase font-semibold">
                    {{ p.country }}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </section>

      </main>

      <!-- Footer -->
      <footer class="mt-auto border-t border-slate-850 px-6 py-6 bg-[#05070B] text-center text-xs text-slate-500">
        <p>© 2026 IPL Auction Game - Official Franchise Squad Data.</p>
      </footer>
    </div>
  `
})
export class TeamsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public franchises = IPL_FRANCHISES_DATA;
  public selectedTeamCode = signal<string>('CSK');
  public showAllGrid = signal<boolean>(true);
  public isLiveDbLoaded = signal<boolean>(false);
  public searchQuery = signal<string>('');

  public filteredFranchises = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.franchises;
    return this.franchises.filter(f => 
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.captain.toLowerCase().includes(q) ||
      f.headCoach.toLowerCase().includes(q) ||
      f.homeGround.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['code']) {
        const found = this.franchises.find(f => f.code.toUpperCase() === params['code'].toUpperCase());
        if (found) {
          this.selectedTeamCode.set(found.code);
          this.showAllGrid.set(false);
          return;
        }
      }
      this.selectedTeamCode.set('CSK');
      this.showAllGrid.set(true);
    });

    this.fetchLiveDbPlayers();
  }

  private fetchLiveDbPlayers(): void {
    this.apiService.get<any[]>('players').subscribe({
      next: (players) => {
        if (players && players.length > 0) {
          this.updateSquadsFromLiveDb(players);
          this.isLiveDbLoaded.set(true);
        }
      },
      error: (err) => {
        console.warn('Using fallback data. Could not fetch live DB players:', err);
      }
    });
  }

  private updateSquadsFromLiveDb(dbPlayers: any[]): void {
    const teamCodeMap: Record<string, TeamPlayer[]> = {
      CSK: [], MI: [], RCB: [], KKR: [], RR: [],
      SRH: [], GT: [], LSG: [], DC: [], PBKS: []
    };

    dbPlayers.forEach(p => {
      let teamCode = p.team || '';
      if (!teamCode && p.description) {
        const match = p.description.match(/IPL 2026 ([A-Z\-]+) player/i);
        if (match) teamCode = match[1];
      }
      teamCode = teamCode.toUpperCase();

      let roleCategory: 'BATTERS_WKS' | 'ALL_ROUNDERS' | 'BOWLERS' = 'BATTERS_WKS';
      if (p.role === 'AllRounder' || p.role === 'All-Rounder') roleCategory = 'ALL_ROUNDERS';
      else if (p.role === 'Bowler') roleCategory = 'BOWLERS';

      const isWk = p.role === 'WicketKeeper' || p.description?.includes('Wicketkeeper');
      const isCaptain = p.description?.includes('Captain') || p.isCaptain;

      if (teamCodeMap[teamCode]) {
        teamCodeMap[teamCode].push({
          name: p.name,
          roleCategory,
          originalRole: p.role,
          isWk: !!isWk,
          isCaptain: !!isCaptain,
          country: p.country || 'India',
          basePriceCr: (p.basePrice || 0) / 10000000,
          acquisition: 'Database',
          imageUrl: p.imageUrl
        });
      }
    });

    this.franchises.forEach(f => {
      if (teamCodeMap[f.code] && teamCodeMap[f.code].length > 0) {
        f.squad = teamCodeMap[f.code];
      }
    });
  }

  public currentTeam(): TeamFranchise | undefined {
    return this.franchises.find(f => f.code === this.selectedTeamCode());
  }

  public battersAndWks(): TeamPlayer[] {
    const squad = this.currentTeam()?.squad || [];
    return squad.filter(p => p.roleCategory === 'BATTERS_WKS');
  }

  public allRounders(): TeamPlayer[] {
    const squad = this.currentTeam()?.squad || [];
    return squad.filter(p => p.roleCategory === 'ALL_ROUNDERS');
  }

  public bowlers(): TeamPlayer[] {
    const squad = this.currentTeam()?.squad || [];
    return squad.filter(p => p.roleCategory === 'BOWLERS');
  }

  public selectTeam(code: string): void {
    this.selectedTeamCode.set(code);
    this.showAllGrid.set(false);
    this.router.navigate(['/teams', code]);
  }

  public showAllFranchises(): void {
    this.showAllGrid.set(true);
    this.router.navigate(['/teams']);
  }

  public toggleViewMode(): void {
    if (this.showAllGrid()) {
      this.showAllGrid.set(false);
      this.router.navigate(['/teams', this.selectedTeamCode()]);
    } else {
      this.showAllFranchises();
    }
  }

  public navigateToHome(): void {
    this.router.navigate(['/']);
  }

  public navigateToPlayers(): void {
    this.router.navigate(['/players']);
  }

  public onLogoError(event: Event, code: string): void {
    const target = event.target as HTMLImageElement;
    if (!target.src.includes('ipl-logo.webp')) {
      target.src = 'ipl-logo.webp';
    }
  }
}
