import { Component, OnInit } from "@angular/core";
// import xml2js from "xml2js";
import { parseString } from "xml2js";
import { HttpClient } from "@angular/common/http";

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
	private url = "assets/data/xmlData.xml";

	constructor(private http: HttpClient) {}

	//   function parseXml(xmlStr) {
	//     var result;
	//     var parser = require('xml2js');
	//     parser.Parser().parseString(xmlStr, (e, r) => {result = r});
	//     return result;
	// }

	ngOnInit() {
		this.getXmlData().subscribe(
			(data) => {
				// this.units = this.parseXmlData(data);
				this.parseXmlData(data);
				this.collectUnitIdAndColor(this.units);
			},
			(err) => console.log("err: ", err)
		);
	}

	getXmlData() {
		return this.http.get(this.url, { responseType: "text" });
	}

	collectUnitIdAndColor(units: any[]) {
		this.idsAndColors = units.reduce((collection, nextUnit) => {
			// const { ID, Gui: [ { Color: [ Blue, Green, Red ] } ] } = nextUnit;
			const { ID, Gui: [ { Color: [ { Red, Green, Blue } ] } ] } = nextUnit;
			collection.push({ id: ID.join(""), color: `rgb(${Red}, ${Green}, ${Blue})` });
			return collection;
		}, []);
	}

	parseXmlData(xml) {
		return parseString(xml, (err, result) => {
			if (err) console.log("parse err: ", err);
			this.units = result.Interview.Unit;
			// return result;
		});
	}
}
