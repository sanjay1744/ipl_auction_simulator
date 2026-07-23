import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SignalRService } from '../../core/services/signalr.service';
import { IPL_FRANCHISES_DATA } from '../../core/data/teams-data';

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

      <!-- Main Lobby 3-Column Layout -->
      <div class="max-w-7xl w-full mx-auto flex-1 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <!-- COLUMN 1 (Left 3 Cols): Joined Room Players Vertical List -->
        <div class="md:col-span-3 flex flex-col gap-6">
          <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4 shadow-xl backdrop-blur-md">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-sm">👥</span>
                <h3 class="font-black text-xs uppercase tracking-wider text-slate-200">Joined Players</h3>
              </div>
              <span class="text-[11px] text-amber-400 font-extrabold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800">
                {{ getParticipantsList().length }} Players
              </span>
            </div>

            <!-- Empty State -->
            <div *ngIf="getParticipantsList().length === 0" class="p-6 rounded-2xl bg-slate-950/40 border border-slate-850 text-center text-xs text-slate-500 flex flex-col gap-2">
              <span class="material-icons text-2xl text-slate-600">group_add</span>
              <span>No players joined yet. Invite friends using code:</span>
              <strong class="text-amber-400 font-mono text-sm tracking-widest">{{ roomCode }}</strong>
            </div>

            <!-- Vertical List of Joined Players -->
            <div *ngIf="getParticipantsList().length > 0" class="flex flex-col gap-3">
              <div 
                *ngFor="let p of getParticipantsList()" 
                class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between shadow-md hover:border-slate-700 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-900 to-indigo-700 border border-indigo-500/40 flex items-center justify-center font-black text-indigo-200 text-xs shadow shrink-0">
                    {{ p.userName?.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <h4 class="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span class="truncate">{{ p.userName }}</span>
                    </h4>
                    <!-- Team Badge -->
                    <div *ngIf="p.teamName" class="flex items-center gap-1 mt-1">
                      <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1 truncate">
                        <span>🛡️</span>
                        <span class="truncate">{{ p.teamCode }} - {{ p.teamName }}</span>
                      </span>
                    </div>
                    <span *ngIf="!p.teamName" class="text-[10px] text-slate-500 font-medium italic mt-0.5">
                      Selecting team...
                    </span>
                  </div>
                </div>

                <span class="w-2.5 h-2.5 rounded-full shrink-0" [class]="p.isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 2 (Center 6 Cols): 10 Franchise Team Cards Grid -->
        <div class="md:col-span-6 flex flex-col gap-6">
          <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-6 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span class="text-xs font-black text-amber-400 uppercase tracking-widest">
                    {{ room()?.isHost ? 'AUCTION FRANCHISES' : 'SELECT YOUR FRANCHISE' }}
                  </span>
                </div>
                <h3 class="text-2xl font-black text-white">IPL 2026 Franchises</h3>
                <p *ngIf="!room()?.isHost && !room()?.userTeam" class="text-xs text-slate-400 mt-1">
                  Click an available team logo below to claim your franchise for the auction
                </p>
                <p *ngIf="!room()?.isHost && room()?.userTeam" class="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <span>✓</span>
                  <span>You claimed {{ room()?.userTeam?.teamName }}. Remaining purse: ₹{{ formatPrice(room()?.userTeam?.remainingBudget) }}</span>
                </p>
                <p *ngIf="room()?.isHost" class="text-xs text-amber-400/90 font-semibold mt-1">
                  👑 Host Mode — Managing auction session while room members claim franchises
                </p>
              </div>
            </div>

            <!-- 10 Aesthetic Team Cards Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div 
                *ngFor="let team of franchises"
                (click)="!room()?.isHost && !isTeamTaken(team) && selectFranchise(team)"
                [class]="isMyTeam(team) 
                  ? 'border-2 border-amber-400 bg-amber-950/25 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/30'
                  : isTeamTaken(team) 
                    ? 'opacity-45 cursor-not-allowed bg-slate-950/80 border-slate-850' 
                    : room()?.isHost 
                      ? 'bg-[#0A0D18] border-slate-800/80' 
                      : 'cursor-pointer bg-[#0A0D18] hover:bg-[#0E1324] border-slate-800/80 hover:border-amber-400/80 hover:scale-105 shadow-lg hover:shadow-2xl'"
                class="group relative rounded-2xl p-3.5 border transition-all duration-300 flex flex-col items-center justify-between gap-2.5 text-center overflow-hidden">
                
                <!-- My Team Top Badge -->
                <div *ngIf="isMyTeam(team)" class="w-full py-0.5 rounded-full bg-amber-400 text-[8px] font-black text-slate-950 uppercase tracking-widest shadow-md">
                  YOUR TEAM
                </div>

                <!-- Logo Box -->
                <div class="w-14 h-14 rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <img [src]="team.logo" [alt]="team.name" class="w-full h-full object-cover rounded-xl" />
                </div>

                <!-- Team Title & Code -->
                <div class="flex flex-col items-center">
                  <span class="text-xs font-black uppercase text-white tracking-wider group-hover:text-amber-300 transition-colors">
                    {{ team.code }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-semibold truncate max-w-[95px] mt-0.5">
                    {{ team.name }}
                  </span>
                </div>

                <!-- Taken Indicator with Claimer Username -->
                <div *ngIf="isTeamTaken(team) && !isMyTeam(team)" class="w-full py-1 px-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[9px] font-bold text-slate-300 tracking-wider flex items-center justify-center gap-1 shadow-inner truncate">
                  <span class="text-amber-400 text-[10px]">👤</span>
                  <span class="truncate font-extrabold text-slate-200">{{ getClaimedByUser(team) || 'Claimed' }}</span>
                </div>

                <!-- Available Indicator if not taken -->
                <div *ngIf="!isTeamTaken(team) && !isMyTeam(team)" class="w-full py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider opacity-80">
                  AVAILABLE
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 3 (Right 3 Cols): Host Card & Auction Controls -->
        <div class="md:col-span-3 flex flex-col gap-6">
          
          <!-- Separate Room Host Card -->
          <div class="p-6 rounded-3xl bg-slate-900/70 border border-amber-500/30 flex flex-col gap-4 shadow-xl backdrop-blur-md">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-lg">👑</span>
                <span class="text-xs font-black uppercase tracking-wider text-amber-400">ROOM HOST</span>
              </div>
              <span *ngIf="room()?.isHost" class="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-[10px] font-black text-amber-300 uppercase">You are Host</span>
            </div>

            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-base shadow-lg">
                {{ (room()?.hostName || 'H').substring(0, 1).toUpperCase() }}
              </div>
              <div class="flex flex-col">
                <h4 class="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{{ room()?.hostName || 'Room Host' }}</span>
                </h4>
                <span class="text-[11px] text-slate-400">Room Administrator</span>
              </div>
            </div>

            <div *ngIf="room()?.isHost" class="pt-2">
              <button 
                (click)="startAuction()"
                class="w-full py-3 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-400/20 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                <span>🚀 START AUCTION SESSION</span>
              </button>
            </div>

            <div *ngIf="!room()?.isHost" class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-400">
              ⏳ Waiting for host <strong>{{ room()?.hostName }}</strong> to start the auction...
            </div>
          </div>

          <!-- Auction Controls Box -->
          <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4 shadow-xl">
            <h3 class="font-black text-sm uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3">Auction Controls</h3>

            <div class="flex flex-col gap-3 text-xs">
              <div class="flex justify-between items-center text-slate-400">
                <span>Auction Type</span>
                <strong class="text-slate-200 font-bold">{{ room()?.auctionType || 'Standard' }}</strong>
              </div>
              <div class="flex justify-between items-center text-slate-400">
                <span>Purse Limit</span>
                <strong class="text-amber-400 font-black">₹{{ formatPrice(room()?.budget) }}</strong>
              </div>
              <div class="flex justify-between items-center text-slate-400">
                <span>Timer per Player</span>
                <strong class="text-slate-200 font-bold">{{ room()?.timer || 30 }} seconds</strong>
              </div>
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
  public isJoining = signal(false);
  public franchises = IPL_FRANCHISES_DATA;

  constructor() {
    // Automatically redirect when auction starts
    effect(() => {
      if (this.signalrService.auctionStatus() === 'Active') {
        this.router.navigate(['/room', this.roomCode]);
      }
    });

    // Automatically reload room details when participants/teams update via SignalR
    effect(() => {
      const parts = this.signalrService.participants();
      if (parts && parts.length > 0 && this.roomCode) {
        this.loadRoomDetails();
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

    this.signalrService.participants.set([]);
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

  public isMyTeam(team: any): boolean {
    const userTeam = this.room()?.userTeam;
    if (!userTeam) return false;
    const name = (userTeam.teamName || userTeam.name || '').toLowerCase();
    const code = (userTeam.teamCode || userTeam.code || '').toLowerCase();
    return name === team.name.toLowerCase() || code === team.code.toLowerCase();
  }

  public isTeamTaken(team: any): boolean {
    const teamsInRoom = this.room()?.teams || [];
    const participants = this.signalrService.participants().length > 0 
      ? this.signalrService.participants() 
      : (this.room()?.participants || []);
    
    const teamCodeLower = (team.code || '').toLowerCase();
    const teamNameLower = (team.name || '').toLowerCase();

    const takenInRoom = teamsInRoom.some((t: any) => {
      const name = (t.teamName || t.name || '').toLowerCase();
      const code = (t.teamCode || t.code || '').toLowerCase();
      return name === teamNameLower || name === teamCodeLower || code === teamCodeLower;
    });

    if (takenInRoom) return true;

    return participants.some((p: any) => {
      const name = (p.teamName || '').toLowerCase();
      return name === teamNameLower || name === teamCodeLower;
    });
  }

  public getClaimedByUser(team: any): string | null {
    const teamsInRoom = this.room()?.teams || [];
    const participants = this.signalrService.participants().length > 0 
      ? this.signalrService.participants() 
      : (this.room()?.participants || []);

    const teamCodeLower = (team.code || '').toLowerCase();
    const teamNameLower = (team.name || '').toLowerCase();

    const inRoom = teamsInRoom.find((t: any) => {
      const name = (t.teamName || t.name || '').toLowerCase();
      const code = (t.teamCode || t.code || '').toLowerCase();
      return name === teamNameLower || name === teamCodeLower || code === teamCodeLower;
    });

    if (inRoom && (inRoom.userName || inRoom.user)) return inRoom.userName || inRoom.user;

    const inPart = participants.find((p: any) => {
      const name = (p.teamName || '').toLowerCase();
      return name === teamNameLower || name === teamCodeLower;
    });

    if (inPart && (inPart.userName || inPart.name)) return inPart.userName || inPart.name;

    return null;
  }

  public selectFranchise(team: any): void {
    if (this.room()?.isHost) return; // Host cannot select a team!
    if (this.isJoining() || this.isTeamTaken(team)) return;
    this.isJoining.set(true);

    this.apiService.post<any>(`rooms/${this.roomCode}/join`, {
      teamName: team.name
    }).subscribe({
      next: () => {
        this.isJoining.set(false);
        this.loadRoomDetails();
      },
      error: (err) => {
        this.isJoining.set(false);
        alert(err.error?.message || 'Could not select franchise team.');
      }
    });
  }

  public startAuction(): void {
    this.signalrService.startAuction().catch((err) => {
      console.error('Error starting auction:', err);
    });
  }

  public getParticipantsList(): any[] {
    const hostName = (this.room()?.hostName || '').toLowerCase();
    const raw = this.signalrService.participants().length > 0
      ? this.signalrService.participants()
      : (this.room()?.participants || []);

    const currentUser = this.apiService.currentUser();
    const roomData = this.room();
    const teamsInRoom = roomData?.teams || [];

    return raw
      .filter((p: any) => 
        p.role !== 'Host' && 
        (p.userName || p.name || '').toLowerCase() !== hostName
      )
      .map((p: any) => {
        const uName = (p.userName || p.name || '').trim();
        const isCurrent = currentUser && (uName.toLowerCase() === currentUser.username?.toLowerCase() || p.userId === currentUser.id);
        
        let teamName = p.teamName || p.team;

        // If current user and room.userTeam exists
        if (!teamName && isCurrent && roomData?.userTeam) {
          teamName = roomData.userTeam.teamName || roomData.userTeam.name;
        }

        // Cross-reference with teams array in room data
        if (!teamName && teamsInRoom.length > 0) {
          const matchedTeam = teamsInRoom.find((t: any) => 
            (t.userName || t.user || '').toLowerCase() === uName.toLowerCase() ||
            (t.userId && p.userId && t.userId === p.userId)
          );
          if (matchedTeam) {
            teamName = matchedTeam.teamName || matchedTeam.name;
          }
        }

        // Match with franchise data to get clean code & full name
        let teamCode = p.teamCode;
        if (teamName) {
          const franchise = this.franchises.find(f => 
            f.name.toLowerCase() === teamName.toLowerCase() || 
            f.code.toLowerCase() === teamName.toLowerCase()
          );
          if (franchise) {
            teamCode = franchise.code;
            teamName = franchise.name;
          } else {
            teamCode = teamName.substring(0, 3).toUpperCase();
          }
        }

        return {
          ...p,
          userName: uName,
          teamName: teamName,
          teamCode: teamCode
        };
      });
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
