import { LowerCasePipe, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-item-list',
  standalone: true,
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css'],
  imports: [NgIf, NgFor, LowerCasePipe] 
})
export class ItemListComponent {
  @Input() items: any[] = [];
  @Input() title: string = '';
  @Output() itemClick = new EventEmitter<string>();

  trackByFn(index: number, item: any) {
    return item.name; // Optimized rendering
  }
}
