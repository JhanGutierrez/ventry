import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtError } from './vt-error';
import { provideZonelessChangeDetection } from '@angular/core';

describe('VtError', () => {
  let component: VtError;
  let fixture: ComponentFixture<VtError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VtError],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VtError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
