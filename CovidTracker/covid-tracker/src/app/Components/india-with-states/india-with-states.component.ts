import { Component, ElementRef, EventEmitter, OnInit, Output } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-india-with-states',
  standalone: true,
  templateUrl: './india-with-states.component.html',
  styleUrls: ['./india-with-states.component.css']
})
export class IndiaWithStatesComponent implements OnInit {
  private svg: any;
  private width = 800;
  private height = 500;
  private projection: any;
  private path: any;
  private geoJsonData: any;
  private selectedFeature: any = null;
  private zoom: any;

  @Output() levelSelected = new EventEmitter<{ level: string; name: string }>();

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    this.createSvg();
    this.loadStateGeoJson();
  }

  private createSvg(): void {
    this.svg = d3
      .select(this.el.nativeElement)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('style', 'max-width: 100%; height: auto;')
      .on('click', () => this.resetZoom());

    this.svg.append('g');

    this.zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', (event) => {
      this.svg.selectAll('g').attr('transform', event.transform);
    });

    this.svg.call(this.zoom);
  }

  private loadStateGeoJson(): void {
    d3.json('assets/india_state.geojson').then((data: any) => {
      this.geoJsonData = data;
      this.drawMap(data.features, 'state');
    });
  }

  private drawMap(features: any[], level: 'state' | 'district' | 'city'): void {
    this.projection = d3.geoMercator().fitSize([this.width, this.height], { type: 'FeatureCollection', features });
    this.path = d3.geoPath().projection(this.projection);

    this.svg.select('g').selectAll('path').remove();

    this.svg
      .select('g')
      .selectAll('path')
      .data(features)
      .enter()
      .append('path')
      .attr('d', this.path)
      .attr('fill', '#757575')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('click', (event: any, d: any) => this.handleClick(event, d));
  }

  private handleClick(event: any, d: any): void {
    event.stopPropagation();
    const name = d.properties.NAME_1 || d.properties.NAME_2 || d.properties.NAME_3;

    // Reset colors
    d3.selectAll('path').attr('fill', '#757575');

    //  Keep the clicked element darker
    d3.select(event.target).attr('fill', '#505050');

    this.selectedFeature = d;
    this.zoomToFeature(d); // Keep it dark while zooming

    // if (d.properties.NAME_1) {
    //   this.loadDistrictGeoJson(name);
    // } else 
    if (d.properties.NAME_2) {
      this.showCities(name);
    }

    this.levelSelected.emit({ level: this.getLevelFromFeature(d), name });
  }


  private zoomToFeature(feature: any): void {
    const [[x0, y0], [x1, y1]] = this.path.bounds(feature);

    // Ensure the selected region retains the dark color after zoom
    d3.selectAll('path').attr('fill', '#757575'); // Reset all paths to default
    this.svg.selectAll('path')
      .filter((d: any) => d === feature)
      .attr('fill', '#505050'); // Keep it dark after zooming

    // Perform the zoom transition
    this.svg.transition().duration(750).call(
      this.zoom.transform,
      d3.zoomIdentity
        .translate(this.width / 2, this.height / 2)
        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    );
  }


  /** Reset Zoom when clicking outside */
  resetZoom(): void {
    console.log("Resetting zoom...");
    this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity);
    this.loadStateGeoJson(); //  Reset to states
  }

  // private loadDistrictGeoJson(stateName: string): void {
  //   d3.json('assets/india_taluk.geojson').then((data: any) => {
  //     this.geoJsonData = data;
  //     this.drawMap(data.features.filter((f: any) => f.properties.NAME_1 === stateName), 'district');
  //   });
  // }

  private showCities(districtName: string): void {
    this.drawMap(this.geoJsonData.features.filter((f: any) => f.properties.NAME_2 === districtName), 'city');
  }

  private getLevelFromFeature(feature: any): 'state' | 'district' | 'city' {
    return feature.properties.NAME_2 ? 'district' : 'state';
  }

  /** Highlight & Zoom when clicking from the list */
  highlightFromList(selectedName: string, level: 'state' | 'district' | 'city') {
    console.log("Highlighting from list:", selectedName, "Level:", level);
    const feature = this.geoJsonData.features.find(
      (f: any) => f.properties.NAME_1 === selectedName || f.properties.NAME_2 === selectedName
    );

    if (!feature) {
      console.error("Feature not found for:", selectedName);
      return;
    }

    this.zoomToFeature(feature);
  }
}
