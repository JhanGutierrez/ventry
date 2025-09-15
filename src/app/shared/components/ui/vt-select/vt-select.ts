import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface VtSelectOption {
  label: string;
  value: string | number | null;
  disabled?: boolean;
}

@Component({
  selector: 'vt-select',
  standalone: true,
  templateUrl: './vt-select.html',
  styleUrl: './vt-select.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VtSelect),
      multi: true,
    },
  ],
})
export class VtSelect implements ControlValueAccessor {
  inputId = input<string>();
  inputLabel = input<string>('Selecciona una opción');

  options = input<VtSelectOption[]>([]);

  protected value = signal<string | number | null>(null);
  protected isDisabled = signal<boolean>(false);

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(obj: any): void {
    this.value.set(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onValueChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.onChange(newValue);
  }

  onBlur(): void {
    this.onTouched();
  }
}