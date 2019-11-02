import { Component, OnInit, Renderer2 } from "@angular/core";
import { parseString } from "xml2js";
import { HttpClient } from "@angular/common/http";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat, toLonLat, transform } from "ol/proj";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import OSM from "ol/source/OSM";
import { Vector as VectorSource } from "ol/source";
import { Icon, Style, Text } from "ol/style";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { defaults as defaultControls } from "ol/control";

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
	range = 0;
	initialSource: VectorSource;
	private url = "assets/data/xmlData.xml";
	EARTH_RADIUS = 6371e3;
	METERS_TO_MILES = 1609.344;

	constructor(private http: HttpClient, private renderer: Renderer2) {}

	ngOnInit() {
		this.initializeMap();

		this.getXmlData().subscribe(
			(data) => {
				this.parseXmlData(data);
				this.collectUnitIdAndColor(this.units);
				this.displayUnitsOnMap();
			},
			(err) => console.log("error in getting xml: ", err)
		);
	}

	initializeMap() {
		this.initialSource = new VectorSource();

		const tileLayer = new TileLayer({
			source: new OSM()
		});

		const vectorLayer = new VectorLayer({
			source: this.initialSource
		});
		vectorLayer.set("id", "vectorLayer");

		this.map = new Map({
			layers: [ tileLayer, vectorLayer ],
			controls: defaultControls({ attribution: false, rotate: false }),
			target: this.renderer.selectRootElement("#map"),
			view: new View({
				center: fromLonLat([ -84, 32 ]),
				zoom: 7
			})
		});
	}

	// change this.range
	adjustRange(evt: Event) {
		this.range = parseFloat((evt.target as HTMLInputElement).value);
		console.log("range: ", this.range);
	}

	// apply highlight to all units within this.range miles of map center
	applyRange() {
		// find map center, make radius extending this.range miles, apply highlights to all in that range
		const mapCenter = toLonLat(this.map.getView().getCenter());
		// retrieve the vectorLayer which contains the source which contains the unit features
		const layer = this.map.getLayers().getArray().find((layer) => layer.get("id") === "vectorLayer");
		// get marker features
		const markers = layer.getSource().getFeatures();
		markers.forEach((marker) => {
			// get location of each marker
			const location = marker.getGeometry().getCoordinates();
			const lonLat = toLonLat(location);
			// if latLon is within 10 miles of map.getViewport() latLon, apply yellow icon
			const withinRange = this.calcDistanceFromMapCenter(mapCenter, lonLat) < this.range;
			const markerId = marker.getStyle().getText().getText();
			if (withinRange) {
				marker.setStyle(this.getIconStyle([ 0, 255, 0, 1 ], markerId));
			} else {
				marker.setStyle(this.getIconStyle([ 128, 224, 255, 1 ], markerId));
			}
		});
	}

	// https://www.movable-type.co.uk/scripts/latlong.html
	calcDistanceFromMapCenter(mapCenter: number[], latLon: number[]): number {
		let [ mapLon, mapLat ] = mapCenter;
		let [ markerLon, markerLat ] = latLon;
		const radianCoords = [ mapLat, mapLon, markerLat, markerLon ].map((coord) => this.toRadians(coord));
		const [ latMap, lonMap, latMarker, lonMarker ] = radianCoords;
		const deltaLat = latMarker - latMap;
		const deltaLon = lonMarker - lonMap;
		const halfChordLength =
			Math.sin(deltaLat / 2) ** 2 + Math.cos(latMap) * Math.cos(latMarker) * Math.sin(deltaLon / 2) ** 2;
		const numerator = Math.sqrt(halfChordLength);
		const denominator = Math.sqrt(1 - halfChordLength);
		const angularDistance = 2 * Math.atan2(numerator, denominator);
		return this.EARTH_RADIUS * angularDistance / 1000; // returns kilometers
	}

	toDegrees(radians: number): number {
		return radians * 180 / Math.PI;
	}

	toRadians(degrees: number): number {
		return degrees * Math.PI / 180;
	}

	getIconStyle(color: number[], id: string): Style {
		return new Style({
			image: new Icon({
				anchor: [ 0.5, 1.2 ],
				color,
				scale: 0.05,
				crossOrigin: "anonymous",
				src: "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png"
			}),
			text: new Text({
				text: id
			})
		});
	}

	getXmlData() {
		return this.http.get(this.url, { responseType: "text" });
	}

	collectUnitIdAndColor(units: any[]) {
		this.idsAndColors = units.reduce((collection, nextUnit) => {
			const { ID, Location: [ { Lat, Lon } ], Gui: [ { Color: [ { Red, Green, Blue } ] } ] } = nextUnit;
			collection.push({
				id: ID.join(""),
				location: { lat: Lat.join(""), lon: Lon.join("") },
				color: `rgb(${Red}, ${Green}, ${Blue})`
			});
			return collection;
		}, []);
	}

	displayUnitsOnMap() {
		if (this.idsAndColors) {
			this.idsAndColors.forEach((unit) => {
				const { color, id, location: { lat, lon } } = unit;
				const marker = new Feature({
					geometry: new Point(transform([ lon, lat ], "EPSG:4326", "EPSG:3857"))
				});

				marker.setStyle(this.getIconStyle(color, id));
				this.initialSource.addFeature(marker);
			});
		}
	}

	parseXmlData(xml) {
		return parseString(xml, (err, result) => {
			if (err) console.log("parse err: ", err);
			this.units = result.Interview.Unit;
		});
	}
}
