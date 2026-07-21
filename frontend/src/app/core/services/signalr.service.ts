import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

export interface ActiveBid {
  bidId?: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  bidderName: string;
  bidAmount: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection?: signalR.HubConnection;
  private readonly hubUrl = 'http://localhost:5281/auctionHub';

  public isConnected = signal(false);
  public connectionError = signal<string | null>(null);

  // Real-time Auction State Signals
  public timerSeconds = signal<number>(30);
  public activePlayer = signal<any | null>(null);
  public latestBid = signal<ActiveBid | null>(null);
  public chatMessages = signal<ChatMessage[]>([]);
  public participants = signal<any[]>([]);
  public auctionStatus = signal<string>('Lobby');
  public logs = signal<string[]>([]);
  public lastSaleNotification = signal<any | null>(null);

  public startConnection(roomCode: string, token: string): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?roomCode=${roomCode}`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.onreconnecting((error) => {
      this.isConnected.set(false);
      this.connectionError.set(`Reconnecting: ${error?.message}`);
    });

    this.hubConnection.onreconnected(() => {
      this.isConnected.set(true);
      this.connectionError.set(null);
    });

    this.hubConnection.onclose((error) => {
      this.isConnected.set(false);
      this.connectionError.set(error ? `Disconnected: ${error.message}` : 'Disconnected');
    });

    this.registerEventHandlers();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected.set(true);
        this.connectionError.set(null);
        console.log('SignalR connection established successfully for room:', roomCode);
      })
      .catch((err) => {
        this.isConnected.set(false);
        this.connectionError.set(`Connection failed: ${err.message}`);
        console.error('Error starting SignalR connection:', err);
      });
  }

  private registerEventHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('TimerTick', (seconds: number) => {
      this.timerSeconds.set(seconds);
    });

    this.hubConnection.on('AuctionStarted', (data: any) => {
      this.auctionStatus.set(data.status || 'Active');
      this.addLog('⚡ Auction has officially started!');
    });

    this.hubConnection.on('PlayerOnBlock', (data: any) => {
      this.activePlayer.set(data.player);
      this.timerSeconds.set(data.timerSeconds || 30);
      this.latestBid.set(null);
      this.addLog(`🏏 ${data.player.name} is now on the block! Base price: ₹${(data.player.basePrice / 10000000).toFixed(2)} Cr.`);
    });

    this.hubConnection.on('BidUpdated', (data: ActiveBid) => {
      this.latestBid.set(data);
      this.addLog(`💰 ${data.teamName} (${data.bidderName}) bid ₹${this.formatPrice(data.bidAmount)} for ${data.playerName}`);
    });

    this.hubConnection.on('PlayerSold', (data: any) => {
      this.lastSaleNotification.set(data);
      this.latestBid.set(null);
      this.addLog(`🎉 SOLD! ${data.playerName} bought by ${data.teamName} for ₹${this.formatPrice(data.soldPrice)}!`);
    });

    this.hubConnection.on('PlayerUnsold', (data: any) => {
      this.latestBid.set(null);
      this.addLog(`❌ UNSOLD! ${data.playerName} went unsold.`);
    });

    this.hubConnection.on('AuctionCompleted', () => {
      this.auctionStatus.set('Completed');
      this.activePlayer.set(null);
      this.latestBid.set(null);
      this.addLog('🏆 IPL Auction completed!');
    });

    this.hubConnection.on('ParticipantsUpdated', (participantsList: any[]) => {
      this.participants.set(participantsList);
    });

    this.hubConnection.on('ChatReceived', (chat: ChatMessage) => {
      this.chatMessages.update((prev) => [...prev, chat]);
    });
  }

  public startAuction(): Promise<void> {
    return this.invoke('StartAuction');
  }

  public placeBid(amount: number): Promise<void> {
    return this.invoke('PlaceBid', amount);
  }

  public sendChatMessage(message: string): Promise<void> {
    return this.invoke('SendChatMessage', message);
  }

  public toggleReady(): Promise<void> {
    return this.invoke('ToggleReady');
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => {
        this.isConnected.set(false);
      });
    }
  }

  public invoke(methodName: string, ...args: any[]): Promise<any> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject('SignalR connection is not connected.');
    }
    return this.hubConnection.invoke(methodName, ...args);
  }

  private addLog(msg: string): void {
    this.logs.update((prev) => [msg, ...prev.slice(0, 49)]);
  }

  private formatPrice(price: number): string {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(0)} L`;
    }
    return price.toLocaleString();
  }
}
