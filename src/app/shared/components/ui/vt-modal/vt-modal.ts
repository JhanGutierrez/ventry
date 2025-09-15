import { Component, input, model, signal, TemplateRef } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'vt-modal',
  imports: [LucideAngularModule, NgTemplateOutlet],
  templateUrl: './vt-modal.html',
  styleUrl: './vt-modal.css',
})
export class VtModal {
  public readonly closeIcon = signal(X);

  actionsTemplate = input<TemplateRef<any> | undefined>(undefined);
  title = input('Modal Title');
  open = model<boolean>(false);
}
