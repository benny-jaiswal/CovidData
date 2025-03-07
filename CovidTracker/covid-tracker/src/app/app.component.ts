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
  selectedName: string = "";
  selectedItems: any[] = [];

  stateGeoJson: any = null; // Stores state-level data
  districtGeoJson: any = null; // Stores district/city data
  covidData: any = null; // Stores COVID-19 data

  constructor() {
    this.loadStateGeoJson(); // Load states initially
    this.loadDistrictGeoJson(); //  Preload district/city data
    this.loadCovidData(); // Load Covid Data
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

  private loadCovidData() {
    d3.json('assets/covid_data.json').then((data: any) => {
        this.covidData = data;
        console.log("Raw COVID Data Loaded:", this.covidData);

        //Compute total cases per state
        Object.keys(this.covidData).forEach(state => {
            let totalConfirmed = 0, totalRecovered = 0, totalDeceased = 0;

            // Sum up district-level data to get state-level totals
            Object.values(this.covidData[state].districtData || {}).forEach((district: any) => {
                totalConfirmed += district.confirmed || 0;
                totalRecovered += district.recovered || 0;
                totalDeceased += district.deceased || 0;
            });

            // Store computed state-level totals
            this.covidData[state].total = {
                confirmed: totalConfirmed,
                recovered: totalRecovered,
                deceased: totalDeceased
            };
        });

        console.log("Computed State Totals:", this.covidData);
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

    this.selectedName = "";
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

    console.log("Updated Level:", this.selectedLevel, "Selected Name:", this.selectedName); 

    this.updateList();
  }

  /*Handles selection when clicking on list item */
  onListItemClick(name: string) {
    console.log("List item clicked:", name, "Current Level:", this.selectedLevel); //  Debugging

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
        // Show all states with COVID data
        this.selectedItems = this.getUniqueList(
            this.stateGeoJson.features.map((feature: any) => {
                const stateName = feature.properties.NAME_1;
                return {
                    name: stateName,
                    confirmed: this.covidData?.[stateName]?.total?.confirmed || 'XX',
                    recovered: this.covidData?.[stateName]?.total?.recovered || 'XX',
                    deceased: this.covidData?.[stateName]?.total?.deceased || 'XX'
                };
            })
        );

        console.log("Loaded States with COVID Data:", this.selectedItems); 
    }
    else if (this.selectedLevel === 'district' && this.districtGeoJson && this.selectedName) {
        // ✅ Show districts with COVID data
        this.selectedItems = this.getUniqueList(
            this.districtGeoJson.features
                .filter((feature: any) => feature.properties.NAME_1 === this.selectedName)
                .map((feature: any) => {
                    const districtName = feature.properties.NAME_2;
                    return {
                        name: districtName,
                        confirmed: this.covidData?.[this.selectedName]?.districtData?.[districtName]?.confirmed || 'XX',
                        recovered: this.covidData?.[this.selectedName]?.districtData?.[districtName]?.recovered || 'XX',
                        deceased: this.covidData?.[this.selectedName]?.districtData?.[districtName]?.deceased || 'XX'
                    };
                })
        );

        console.log("Loaded Districts for", this.selectedName, "with COVID Data:", this.selectedItems); 
    }
    else if (this.selectedLevel === 'city' && this.districtGeoJson && this.selectedName) {
        // ✅ Show cities (if available) - Placeholder as COVID data may not have city-level data
        this.selectedItems = this.getUniqueList(
            this.districtGeoJson.features
                .filter((feature: any) => feature.properties.NAME_2 === this.selectedName)
                .map((feature: any) => ({
                    name: feature.properties.NAME_3,
                    confirmed: 'XX',  // No city-level COVID data available
                    recovered: 'XX',
                    deceased: 'XX'
                }))
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
