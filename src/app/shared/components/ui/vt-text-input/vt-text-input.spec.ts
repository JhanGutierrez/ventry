import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtTextInput } from './vt-text-input';
import { provideZonelessChangeDetection } from '@angular/core';

describe('VtTextInput', () => {
  let component: VtTextInput;
  let fixture: ComponentFixture<VtTextInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VtTextInput],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VtTextInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
