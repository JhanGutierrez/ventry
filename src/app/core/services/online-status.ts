import { Injectable } from '@angular/core';
import { fromEvent, map, merge, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OnlineStatus {
  public online$: Observable<boolean>;

  constructor() {
    this.online$ = merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    );
  }
  isOnline(): boolean {
    return navigator.onLine;
  }
}