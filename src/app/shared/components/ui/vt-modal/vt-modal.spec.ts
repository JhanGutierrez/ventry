import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtModal } from './vt-modal';
import { provideZonelessChangeDetection } from '@angular/core';

describe('Modal', () => {
  let component: VtModal;
  let fixture: ComponentFixture<VtModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VtModal],
      providers: [provideZonelessChangeDetection()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(VtModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
