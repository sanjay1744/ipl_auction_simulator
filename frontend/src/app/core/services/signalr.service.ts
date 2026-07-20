import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection?: signalR.HubConnection;
  private readonly hubUrl = 'http://localhost:5281/auctionHub';

  // Signals to expose state to components
  public isConnected = signal(false);
  public connectionError = signal<string | null>(null);

  /**
   * Start SignalR connection and join a specific auction room group
   */
  public startConnection(roomCode: string, token: string): void {
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

    this.hubConnection.onreconnected((connectionId) => {
      this.isConnected.set(true);
      this.connectionError.set(null);
    });

    this.hubConnection.onclose((error) => {
      this.isConnected.set(false);
      this.connectionError.set(error ? `Disconnected: ${error.message}` : 'Disconnected');
    });

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected.set(true);
        this.connectionError.set(null);
        console.log('SignalR connection established successfully.');
      })
      .catch((err) => {
        this.isConnected.set(false);
        this.connectionError.set(`Connection failed: ${err.message}`);
        console.error('Error starting SignalR connection:', err);
      });
  }

  /**
   * Stop the current hub connection
   */
  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => {
          this.isConnected.set(false);
          console.log('SignalR connection stopped.');
        });
    }
  }

  /**
   * Listen to a specific hub event
   */
  public listen<T>(eventName: string, callback: (data: T) => void): void {
    this.hubConnection?.on(eventName, callback);
  }

  /**
   * Invoke a method on the hub
   */
  public invoke(methodName: string, ...args: any[]): Promise<any> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject('SignalR connection is not established or connected.');
    }
    return this.hubConnection.invoke(methodName, ...args);
  }
}
