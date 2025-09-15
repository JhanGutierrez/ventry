import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtButton } from './vt-button';
import { provideZonelessChangeDetection } from '@angular/core';

describe('VtButton', () => {
  let component: VtButton;
  let fixture: ComponentFixture<VtButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VtButton],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VtButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
