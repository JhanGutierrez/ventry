import { Component, input, TemplateRef } from '@angular/core';
import { NestedCellValuePipe } from './pipes/nested-cell-value-pipe';

export interface DataTableHeaders<T = any> {
  key: string;
  label: string;
  template?: TemplateRef<any>;
  cellValue?: (row: T) => any;
}

@Component({
  selector: 'data-table',
  imports: [NestedCellValuePipe],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css'
})
export class DataTable {
  headers = input.required<DataTableHeaders[]>();
  data = input.required<any[]>();
}