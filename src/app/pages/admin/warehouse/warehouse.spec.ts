import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Warehouse } from './warehouse';
import { provideZonelessChangeDetection } from '@angular/core';

describe('Warehouse', () => {
  let component: Warehouse;
  let fixture: ComponentFixture<Warehouse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Warehouse],
      providers:[
         provideZonelessChangeDetection(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Warehouse);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
