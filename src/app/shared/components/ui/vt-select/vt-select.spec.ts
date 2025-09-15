import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtSelect } from './vt-select';
import { provideZonelessChangeDetection } from '@angular/core';

describe('VtSelect', () => {
  let component: VtSelect;
  let fixture: ComponentFixture<VtSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VtSelect],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VtSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
