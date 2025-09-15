import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inventory } from './inventory';
import { provideZonelessChangeDetection } from '@angular/core';

describe('Inventory', () => {
  let component: Inventory;
  let fixture: ComponentFixture<Inventory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inventory],
      providers:[
         provideZonelessChangeDetection(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inventory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
