import { TestBed } from '@angular/core/testing';
import { OnlineStatus } from './online-status';
import { firstValueFrom } from 'rxjs';
import { skip } from 'rxjs/operators';
import { provideZonelessChangeDetection } from '@angular/core';

describe('OnlineStatus', () => {
  let service: OnlineStatus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OnlineStatus, provideZonelessChangeDetection()],
    });
    service = TestBed.inject(OnlineStatus);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit the initial navigator.onLine status on subscription', async () => {
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);
    service = TestBed.inject(OnlineStatus);

    const status = await firstValueFrom(service.online$);
    expect(status).toBeTrue();
  });

  it('should emit true when window goes online', async () => {
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    service = TestBed.inject(OnlineStatus);

    const statusPromise = firstValueFrom(service.online$.pipe(skip(1)));

    window.dispatchEvent(new Event('online'));

    const newStatus = await statusPromise;
    expect(newStatus).toBeTrue();
  });

  it('should emit false when window goes offline', async () => {
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);
    service = TestBed.inject(OnlineStatus);

    const statusPromise = firstValueFrom(service.online$.pipe(skip(1)));

    window.dispatchEvent(new Event('offline'));

    const newStatus = await statusPromise;
    expect(newStatus).toBeFalse();
  });

  it('isOnline() should return false when navigator.onLine is false', () => {
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    expect(service.isOnline()).toBeFalse();
  });

  it('isOnline() should return true when navigator.onLine is true', () => {
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);
    expect(service.isOnline()).toBeTrue();
  });
});
