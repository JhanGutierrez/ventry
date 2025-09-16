import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, map, merge, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OnlineStatus {
  private onlineStatus$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    const goOnline$ = fromEvent(window, 'online').pipe(map(() => true));
    const goOffline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(goOnline$, goOffline$).subscribe((isOnline) => this.onlineStatus$.next(isOnline));
  }

  public get status$(): Observable<boolean> {
    return this.onlineStatus$.asObservable();
  }

  public isOnline(): boolean {
    return this.onlineStatus$.getValue();
  }
}