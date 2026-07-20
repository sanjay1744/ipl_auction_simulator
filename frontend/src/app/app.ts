import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly apiService = inject(ApiService);
  
  protected readonly title = signal('IPL Auction Game');
  protected readonly players = signal<any[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly fetchError = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchPlayers();
  }

  private fetchPlayers(): void {
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

  protected retryFetch(): void {
    this.fetchPlayers();
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

  /**
   * Helper to format numbers into standard Indian IPL denominations (Crores/Lakhs)
   */
  protected formatPrice(price: number): string {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Crore`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(0)} Lakh`;
    }
    return `₹${price.toLocaleString()}`;
  }
}
