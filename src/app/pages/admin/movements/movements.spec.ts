import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Movements } from './movements';
import { provideZonelessChangeDetection } from '@angular/core';
import { Apollo } from 'apollo-angular';

describe('Movements', () => {
  let component: Movements;
  let fixture: ComponentFixture<Movements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Movements],
      providers: [Apollo, provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(Movements);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
