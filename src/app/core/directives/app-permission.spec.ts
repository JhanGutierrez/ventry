// Se importan las herramientas de prueba de Angular y las dependencias a simular.
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, TemplateRef, ViewContainerRef } from '@angular/core';
import { AppPermission } from './app-permission';
import { SessionManager } from '@core/services/session-manager';

describe('AppPermission', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AppPermission,
        { provide: TemplateRef, useValue: {} },
        { provide: ViewContainerRef, useValue: {} },
        { provide: SessionManager, useValue: {} },
      ],
    });

    const directive = TestBed.inject(AppPermission);
    expect(directive).toBeTruthy();
  });
});
