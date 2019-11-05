import { Component, OnInit, Renderer2, OnDestroy } from "@angular/core";
import { parseString } from "xml2js";
import { HttpClient } from "@angular/common/http";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat, toLonLat, transform } from "ol/proj";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import OSM from "ol/source/OSM";
import { Vector as VectorSource } from "ol/source";
import { Style, Text, Fill, Stroke, Circle } from "ol/style";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { defaults as defaultControls } from "ol/control";

@Component({
	selector: "feature",
	templateUrl: "./feature.component.html",
	styleUrls: [ "./feature.component.css" ]
})
export class FeatureComponent implements OnInit, OnDestroy {
	data: any;
	parsedData: any;
	units: any;
	idsAndColors = [];
	map: Map;
	features: Feature[] = [];
	range = 0;
	initialSource: VectorSource;
	defaultStyle = [ 124, 228, 255 ];
	hightlightStyle = [ 255, 255, 0 ];
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

	ngOnDestroy() {
		this.data = null;
		this.parsedData = null;
		this.units = null;
		this.idsAndColors = [];
		this.map = null;
		this.features = [];
		this.range = 0;
		this.initialSource = null;
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
	}

	// apply highlight to all units within this.range kilometers of map center
	applyRange() {
		// find map center, make radius extending this.range miles, apply highlights to all in that range
		const mapCenter = toLonLat(this.map.getView().getCenter());
		// retrieve the vectorLayer which contains the source which contains the unit features
		const layer = this.map.getLayers().getArray().find((layer) => layer.get("id") === "vectorLayer");
		// get marker features
		const markers = layer.getSource().getFeatures();
		this.features.forEach((marker) => {
			// get location of each marker
			const location = marker.getGeometry().getCoordinates();
			const lonLat = toLonLat(location);
			const markerId = marker.getStyle().getText().getText();
			// if latLon is within this.range km of another point, apply yellow highlight
			const withinRange = this.findMarkerWithinRange(lonLat, markerId);
			if (withinRange) {
				marker.setStyle(this.getIconStyle(this.hightlightStyle, markerId));
			} else {
				marker.setStyle(this.getIconStyle(this.defaultStyle, markerId));
			}
		});
	}

	// https://www.movable-type.co.uk/scripts/latlong.html
	calcDistanceBtwnPoints(feature: Feature, latLon: number[]): number {
		let [ markerLon, markerLat ] = latLon;
		const lonLat2 = toLonLat(feature.getGeometry().getCoordinates());
		let [ compareLon, compareLat ] = lonLat2;
		const radianCoords = [ compareLat, compareLon, markerLat, markerLon ].map((coord) => this.toRadians(coord));
		const [ latPoint2, lonPoint2, latMarker, lonMarker ] = radianCoords;
		const deltaLat = latPoint2 - latMarker;
		const deltaLon = lonPoint2 - lonMarker;
		const halfChordLength =
			Math.sin(deltaLat / 2) ** 2 + Math.cos(latPoint2) * Math.cos(latMarker) * Math.sin(deltaLon / 2) ** 2;
		const numerator = Math.sqrt(halfChordLength);
		const denominator = Math.sqrt(1 - halfChordLength);
		const angularDistance = 2 * Math.atan2(numerator, denominator);
		return this.EARTH_RADIUS * angularDistance / 1000; // returns kilometers
	}

	// use a point's lat/lng to see if any other markers are within range
	findMarkerWithinRange(latLon: number[], id: string): boolean {
		return this.features.some(
			(feature) =>
				feature.getStyle().getText().getText() !== id &&
				this.calcDistanceBtwnPoints(feature, latLon) < this.range
		);
	}

	toDegrees(radians: number): number {
		return radians * 180 / Math.PI;
	}

	toRadians(degrees: number): number {
		return degrees * Math.PI / 180;
	}

	getIconStyle(color: number[], id: string): Style {
		return new Style({
			image: new Circle({
				radius: 6,
				fill: new Fill({
					color
				}),
				stroke: new Stroke({
					color,
					width: 4
				})
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
				this.features.push(marker);
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
