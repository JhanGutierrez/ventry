import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nestedCellValue',
  pure: true,
})
export class NestedCellValuePipe implements PipeTransform {
  transform(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
