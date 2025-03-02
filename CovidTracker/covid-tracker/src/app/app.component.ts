import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { IndiaWithStatesComponent } from './Components/india-with-states/india-with-states.component';
import * as d3 from 'd3';
import { ItemListComponent } from './Components/item-list/item-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, ItemListComponent, IndiaWithStatesComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild(IndiaWithStatesComponent) indiaWithStatesComponent!: IndiaWithStatesComponent; 

  selectedLevel: 'state' | 'district' | 'city' = 'state';
  selectedName: string | null = null;
  selectedItems: any[] = [];

  stateGeoJson: any = null; // Stores state-level data
  districtGeoJson: any = null; // Stores district/city data

  constructor() {
    this.loadStateGeoJson(); // Load states initially
    this.loadDistrictGeoJson(); //  Preload district/city data
  }

  ngAfterViewInit(): void {
    console.log("IndiaWithStatesComponent initialized:", this.indiaWithStatesComponent);
  }

  /** Load state-level data */
  private loadStateGeoJson() {
    d3.json('assets/india_state.geojson').then((data: any) => {
      this.stateGeoJson = data;
      this.updateList(); //  Load state list initially
    });
  }

  /**  Load district/city data */
  private loadDistrictGeoJson() {
    d3.json('assets/india_taluk.geojson').then((data: any) => {
      this.districtGeoJson = data;
    });
  }

  /** Handles Back Navigation */
  onBack() {
    console.log("Back Button Clicked - Current Level:", this.selectedLevel);

    if (this.selectedLevel === 'city') {
        this.selectedLevel = 'district';
    } else if (this.selectedLevel === 'district') {
        this.selectedLevel = 'state';
    } else {
        this.selectedLevel = 'state'; // Prevent any issues
    }

    this.selectedName = null;
    this.updateList();

    if (this.selectedLevel === 'state' && this.indiaWithStatesComponent) {
        this.indiaWithStatesComponent.resetZoom(); // Reset zoom when moving back to state level
    }
}


  /**  Handles selection from Map OR List */
  onLevelSelected(event: { level: string; name: string }) {
    console.log("onLevelSelected received:", event); // 🛠 Debugging

    if (this.selectedLevel === 'state') {
      this.selectedLevel = 'district'; //  Move to District Level
    } else if (this.selectedLevel === 'district') {
      this.selectedLevel = 'city'; //  Move to City Level
    }

    this.selectedName = event.name;

    console.log("Updated Level:", this.selectedLevel, "Selected Name:", this.selectedName); // 🛠 Debugging

    this.updateList();
  }

  /*Handles selection when clicking on list item */
  onListItemClick(name: string) {
    console.log("List item clicked:", name, "Current Level:", this.selectedLevel); // 🛠 Debugging

    this.onLevelSelected({ level: this.selectedLevel, name });

    if (!this.indiaWithStatesComponent) {
      console.error("IndiaWithStatesComponent is undefined");
      return;
    }

    // Highlight & Zoom to the selected state/district in the map
    this.indiaWithStatesComponent.highlightFromList(name, this.selectedLevel);
  }

  /**  Fetch & filter data dynamically */
  private updateList() {
    console.log("Updating list for level:", this.selectedLevel, "Selected name:", this.selectedName); 

    if (this.selectedLevel === 'state' && this.stateGeoJson) {
        // ✅ Show all states on initial load
        this.selectedItems = this.getUniqueList(
            this.stateGeoJson.features.map((feature: any) => ({
                name: feature.properties.NAME_1
            }))
        );
        console.log("Loaded States:", this.selectedItems); 
    }
    else if (this.selectedLevel === 'district' && this.districtGeoJson) {
        // ✅ Show districts when a state is selected, ensuring uniqueness
        this.selectedItems = this.getUniqueList(
            this.districtGeoJson.features
                .filter((feature: any) => feature.properties.NAME_1 === this.selectedName)
                .map((feature: any) => ({ name: feature.properties.NAME_2 }))
        );

        console.log("Loaded Districts for", this.selectedName, ":", this.selectedItems); 
    }
    else if (this.selectedLevel === 'city' && this.districtGeoJson) {
        // ✅ Show cities when a district is selected, ensuring uniqueness
        this.selectedItems = this.getUniqueList(
            this.districtGeoJson.features
                .filter((feature: any) => feature.properties.NAME_2 === this.selectedName)
                .map((feature: any) => ({ name: feature.properties.NAME_3 }))
        );

        console.log("Loaded Cities for", this.selectedName, ":", this.selectedItems); 
    }
}
private getUniqueList(items: any[]): any[] {
  return items.filter((item, index, self) =>
      index === self.findIndex((t) => t.name === item.name)
  );
}


}
