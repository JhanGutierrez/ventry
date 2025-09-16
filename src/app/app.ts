import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SyncData } from '@core/services/sync-data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  syncData = inject(SyncData);

  ngOnInit(): void {
    this.syncData.startSync();
  }
}
