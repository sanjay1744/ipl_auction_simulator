import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { IPL_FRANCHISES_DATA, TeamFranchise, TeamPlayer } from '../../core/data/teams-data';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#07090E] text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-black">
      
      <!-- Official TATA IPL Header Navigation -->
      <header class="sticky top-0 z-50 bg-[#18358A] shadow-2xl border-b border-[#2445A8] px-6 py-3 flex items-center justify-between">
        
        <!-- Left: Official TATA IPL Logo -->
        <div class="flex items-center gap-4 cursor-pointer" (click)="navigateToHome()">
          <img src="Mode=Dark,_Version=A.webp" alt="TATA IPL Logo" class="h-10 md:h-12 w-auto object-contain drop-shadow-md" />
        </div>

        <!-- Center: IPL 2026 FRANCHISES Title / Nav Links -->
        <h1 class="text-xl md:text-2xl font-black tracking-widest uppercase text-white font-mono">
          IPL 2026 <span class="text-amber-400">FRANCHISES</span>
        </h1>

        <!-- Right Action: All Franchises Toggle -->
        <div class="flex items-center gap-3">
          <button 
            (click)="toggleViewMode()" 
            class="px-4 py-2 rounded-lg border border-amber-400/50 bg-amber-400 text-slate-950 text-xs font-black tracking-wider hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20">
            <span>{{ showAllGrid() ? 'SELECT TEAM' : 'ALL FRANCHISES' }}</span>
            <span class="material-icons text-sm">grid_view</span>
          </button>
        </div>
      </header>

      <!-- Main Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        <!-- Quick Franchise Selector Chips -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/60">
          <button 
            *ngFor="let team of franchises"
            (click)="selectTeam(team.code)"
            [style.background-color]="selectedTeamCode() === team.code && !showAllGrid() ? team.primaryColor : '#0E121B'"
            [style.border-color]="team.primaryColor"
            [style.color]="selectedTeamCode() === team.code && !showAllGrid() ? '#000000' : '#E2E8F0'"
            class="px-4 py-2 rounded-xl border text-xs font-black tracking-wide uppercase transition-all whitespace-nowrap shadow-md">
            <span>{{ team.code }}</span>
          </button>
        </div>

        <!-- VIEW A: ALL FRANCHISES GRID (Dynamic Franchise Team Colors matching exact reference images) -->
        <section *ngIf="showAllGrid()" class="flex flex-col gap-6 animate-fadeIn">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold tracking-tight text-slate-200">
              Select an IPL 2026 Franchise
            </h2>
            <span class="text-xs text-slate-400 font-medium">10 Official Franchises</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              *ngFor="let team of franchises"
              (click)="selectTeam(team.code)"
              class="group relative bg-[#0A0D15] border-2 rounded-2xl p-6 transition-all cursor-pointer shadow-2xl flex flex-col justify-between gap-6 overflow-hidden hover:scale-[1.02]"
              [style.border-color]="team.primaryColor"
              [style.box-shadow]="'0 0 20px ' + team.primaryColor + '25'">
              
              <!-- Top Row: Logo & Team Name -->
              <div class="flex flex-col items-center text-center gap-3">
                <div class="w-20 h-20 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-center p-3 shadow-md group-hover:scale-105 transition-transform">
                  <div class="font-black text-2xl tracking-tighter" [style.color]="team.primaryColor">
                    {{ team.code }}
                  </div>
                </div>

                <div class="flex flex-col items-center">
                  <h3 class="text-lg font-black tracking-tight uppercase leading-tight" [style.color]="team.primaryColor">
                    {{ team.name }}
                  </h3>
                </div>
              </div>

              <!-- Team Quick Stats Grid -->
              <div class="flex flex-col gap-1.5 bg-[#06080D] rounded-xl p-3.5 border border-slate-850 text-xs text-center">
                <div class="text-slate-400">
                  Captain: <strong [style.color]="team.primaryColor">{{ team.captain }}</strong>
                </div>
                <div class="text-slate-400">
                  Coach: <strong [style.color]="team.primaryColor">{{ team.headCoach }}</strong>
                </div>
              </div>

              <!-- Card Action Button -->
              <button 
                class="w-full py-2.5 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all text-center group-hover:bg-slate-900"
                [style.border-color]="team.primaryColor"
                [style.color]="team.primaryColor">
                VIEW SQUAD
              </button>
            </div>
          </div>
        </section>

        <!-- VIEW B: SELECTED FRANCHISE DETAILS & SQUAD (Dynamic Franchise Brand Color Matching Image) -->
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
                class="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#06080D] border-2 flex items-center justify-center p-3 shadow-2xl"
                [style.border-color]="currentTeam()!.primaryColor">
                <div class="font-black text-2xl md:text-3xl tracking-tighter" [style.color]="currentTeam()!.primaryColor">
                  {{ currentTeam()!.code }}
                </div>
              </div>

              <div class="flex flex-col">
                <span class="text-xs font-bold tracking-widest uppercase opacity-80" [style.color]="currentTeam()!.primaryColor">
                  IPL 2026 FRANCHISE
                </span>
                <h2 class="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1 leading-none" [style.color]="currentTeam()!.primaryColor">
                  {{ currentTeam()!.name }}
                </h2>
              </div>
            </div>

            <!-- Right: 3 Key Metadata Info Cards (Bordered in Franchise Primary Color) -->
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

          <!-- Squad Categorized in 3 Distinct Columns (Bordered in Franchise Primary Color) -->
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
  public showAllGrid = signal<boolean>(false);
  public isLiveDbLoaded = signal<boolean>(false);

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
  }

  public toggleViewMode(): void {
    this.showAllGrid.update(v => !v);
  }

  public navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
