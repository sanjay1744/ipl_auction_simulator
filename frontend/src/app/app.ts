import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  public readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly title = signal('IPL Auction Game');
  protected readonly players = signal<any[]>([]);
  protected readonly publicRooms = signal<any[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly fetchError = signal<string | null>(null);

  public showSetupModal = signal(false);
  public isHomePage = signal(true);

  // Setup room form state
  public roomName = '';
  public budget = 1000000000; // 100 Crores
  public timer = 30;
  public joinCode = '';
  public isCreating = signal(false);

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isHomePage.set(event.url === '/' || event.url === '');
      }
    });

    this.fetchPlayers();
    this.fetchPublicRooms();
  }

  protected fetchPlayers(): void {
    this.isLoading.set(true);
    this.fetchError.set(null);

    this.apiService.get<any[]>('players').subscribe({
      next: (data) => {
        this.players.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching players:', err);
        this.fetchError.set(
          'Could not connect to the backend API. Please make sure the backend server is running on http://localhost:5281.'
        );
        this.isLoading.set(false);
      }
    });
  }

  protected fetchPublicRooms(): void {
    this.apiService.get<any[]>('rooms/public').subscribe({
      next: (data) => {
        this.publicRooms.set(data);
      },
      error: () => {
        // Ignore error if not initialized
      }
    });
  }

  protected openCreateRoomModal(): void {
    if (!this.apiService.currentUser()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.showSetupModal.set(true);
  }

  protected submitCreateRoom(): void {
    if (!this.roomName.trim()) return;
    this.isCreating.set(true);

    this.apiService.post<any>('rooms', {
      roomName: this.roomName.trim(),
      budget: this.budget,
      timer: this.timer
    }).subscribe({
      next: (room) => {
        this.isCreating.set(false);
        this.showSetupModal.set(false);
        this.router.navigate(['/lobby', room.roomCode]);
      },
      error: (err) => {
        this.isCreating.set(false);
        alert(err.error?.message || 'Failed to create room.');
      }
    });
  }

  protected submitJoinRoom(): void {
    if (!this.joinCode.trim()) return;
    if (!this.apiService.currentUser()) {
      this.router.navigate(['/auth'], { queryParams: { returnUrl: `/lobby/${this.joinCode.trim().toUpperCase()}` } });
      return;
    }
    this.router.navigate(['/lobby', this.joinCode.trim().toUpperCase()]);
  }

  protected navigateToAuth(): void {
    this.router.navigate(['/auth']);
  }

  protected logout(): void {
    this.apiService.clearSession();
    this.router.navigate(['/']);
  }

  protected retryFetch(): void {
    this.fetchPlayers();
    this.fetchPublicRooms();
  }

  protected getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `https://ik.imagekit.io/vmoilpdg4/tr:w-150,h-150,fo-face,q-80/${path}`;
  }

  protected onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.nextElementSibling) {
      (target.nextElementSibling as HTMLElement).style.display = 'flex';
    }
  }

  protected formatPrice(price: number): string {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Crore`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(0)} Lakh`;
    }
    return `₹${price.toLocaleString()}`;
  }
}
