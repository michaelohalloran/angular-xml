import { Component, OnInit, Renderer2 } from "@angular/core";
import { parseString } from "xml2js";
import { HttpClient } from "@angular/common/http";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat, transform } from "ol/proj";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import OSM from "ol/source/OSM";
import { Vector as VectorSource } from "ol/source";
import { Icon, Style, Fill, Stroke, Text } from "ol/style";
import Feature from "ol/Feature";
import { Point } from "ol/geom";

@Component({
	selector: "feature",
	templateUrl: "./feature.component.html",
	styleUrls: [ "./feature.component.css" ]
})
export class FeatureComponent implements OnInit {
	data: any;
	parsedData: any;
	units: any;
	idsAndColors = [];
	map: Map;
	range: number;
	initialSource: VectorSource;
	private url = "assets/data/xmlData.xml";

	constructor(private http: HttpClient, private renderer: Renderer2) {}

	ngOnInit() {
		this.initializeMap();

		this.getXmlData().subscribe(
			(data) => {
				// this.units = this.parseXmlData(data);
				this.parseXmlData(data);
				this.collectUnitIdAndColor(this.units);
				this.displayUnitsOnMap();
			},
			(err) => console.log("err: ", err)
		);
	}

	initializeMap() {
		this.initialSource = new VectorSource();
		const unitStyle = new Style({
			fill: new Fill({ color: "blue" }),
			stroke: new Stroke({ color: "green" }),
			image: new Icon({
				// anchor: [0.5, 46],
				// color:
				// imgSize: [ 100, 100 ],
				// size: 50,
				scale: 0.05,
				src: "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png",
				opacity: 0.8
			}),
			text: new Text({
				text: "Sample text"
			})
		});

		const tileLayer = new TileLayer({
			source: new OSM()
		});

		const vectorLayer = new VectorLayer({
			source: this.initialSource
			// style: unitStyle
		});

		this.map = new Map({
			layers: [ tileLayer, vectorLayer ],
			target: this.renderer.selectRootElement("#map"),
			view: new View({
				center: fromLonLat([ -84, 32 ]),
				zoom: 6
			})
		});
	}

	// change this.range
	adjustRange(evt: Event) {
		// console.log("range evt: ", evt.value);
		this.range = parseInt((evt.target as HTMLInputElement).value);
		console.log("range: ", this.range);
	}

	// apply highlight to all units within this.range miles (of what?)
	applyRange() {
		// find map center, make radius extending this.range miles, apply highlights to all in that range
	}

	getXmlData() {
		return this.http.get(this.url, { responseType: "text" });
	}

	collectUnitIdAndColor(units: any[]) {
		this.idsAndColors = units.reduce((collection, nextUnit) => {
			// const { ID, Gui: [ { Color: [ Blue, Green, Red ] } ] } = nextUnit;
			const { ID, Location: [ { Lat, Lon } ], Gui: [ { Color: [ { Red, Green, Blue } ] } ] } = nextUnit;
			collection.push({
				id: ID.join(""),
				location: { lat: Lat.join(""), lon: Lon.join("") },
				color: `rgb(${Red}, ${Green}, ${Blue})`
			});
			return collection;
		}, []);
		console.log("ids, colors, location: ", this.idsAndColors);
	}

	displayUnitsOnMap() {
		if (this.idsAndColors) {
			this.idsAndColors.forEach((unit) => {
				// this.map.addFeature()
				const { color, id, location: { lat, lon } } = unit;
				const marker = new Feature({
					geometry: new Point(transform([ lon, lat ], "EPSG:4326", "EPSG:3857"))
					// name: "Sample"
				});
				// const markerStyle = new Style({
				// 	fill: new Fill({ color: "green" })
				// });
				// marker.setStyle(markerStyle);
				marker.setStyle(
					new Style({
						image: new Icon({
							color,
							scale: 0.05,
							crossOrigin: "anonymous",
							src: "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png"
						}),
						text: new Text({
							text: id
						})
					})
				);
				this.initialSource.addFeature(marker);
			});
		}
		// add them as overlays? features? to the map
		// use this.unit.color for each one's color
		// use this.unit.id for adding innerHTML
		// this.unit.location is an object w/ lat and lon props; use this for locations
	}

	parseXmlData(xml) {
		return parseString(xml, (err, result) => {
			if (err) console.log("parse err: ", err);
			this.units = result.Interview.Unit;
			console.log("units: ", this.units);
			// return result;
		});
	}
}
