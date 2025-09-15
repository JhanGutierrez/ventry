import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'vt-text-input',
  imports: [],
  templateUrl: './vt-text-input.html',
  styleUrl: './vt-text-input.css',
  providers:[{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => VtTextInput),
    multi: true
  }]
})
export class VtTextInput implements ControlValueAccessor {
  inputType = input<'text' | 'email' | 'number' | 'password'>('text');
  inputId = input<string>();
  inputLabel = input<string>("aaaa");

  protected value = signal<string| number | null> ('');
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
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.onChange(newValue);
  }

  onBlur(): void {
    this.onTouched();
  }
}