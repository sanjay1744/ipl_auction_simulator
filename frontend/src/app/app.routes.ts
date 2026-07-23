import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth';
import { LobbyComponent } from './features/lobby/lobby';
import { AuctionRoomComponent } from './features/auction-room/auction-room';
import { TeamsComponent } from './features/teams/teams';
import { PlayersComponent } from './features/players/players';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'teams', component: TeamsComponent },
  { path: 'teams/:code', component: TeamsComponent },
  { path: 'players', component: PlayersComponent },
  { path: 'lobby/:code', component: LobbyComponent },
  { path: 'room/:code', component: AuctionRoomComponent },
  { path: '**', redirectTo: '' }
];
