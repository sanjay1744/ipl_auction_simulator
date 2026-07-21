import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth';
import { LobbyComponent } from './features/lobby/lobby';
import { AuctionRoomComponent } from './features/auction-room/auction-room';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'lobby/:code', component: LobbyComponent },
  { path: 'room/:code', component: AuctionRoomComponent },
  { path: '**', redirectTo: '' }
];
