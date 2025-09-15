import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtSpinner } from './vt-spinner';

describe('VtSpinner', () => {
  let component: VtSpinner;
  let fixture: ComponentFixture<VtSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VtSpinner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VtSpinner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
