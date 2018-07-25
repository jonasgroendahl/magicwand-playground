import React, { PureComponent } from 'react';
import * as turf from "@turf/turf";
import alphaShape from 'alpha-shape';



const google = window.google;

function awesomefunc(minVal, maxVal, range, pos) {
    return minVal + ((maxVal - minVal) / range) * pos;
};


function awesomeSelection(data, point, width, height) {
    let finished = false;
    let matchColor = point.color;
    let matches = [];
    let final = [point.index];
    matches.push(point.index);
    while (!finished) {
        let newMatches = [];
        for (let m of matches) {
            if ((m + 1) % width !== 0
                && data[m + 1].color == matchColor
                && final.indexOf(data[m + 1].index) == -1
            ) {
                newMatches.push(data[m + 1].index);
                final.push(data[m + 1].index);
            }
            if (
                (m - 1) % width !== 0
                && data[m - 1].color == matchColor
                && final.indexOf(data[m - 1].index) == -1
            ) {
                newMatches.push(data[m - 1].index);
                final.push(data[m - 1].index);
            }
            if (
                m > width
                && data[m - width].color == matchColor
                && final.indexOf(data[m - width].index) == -1
            ) {
                newMatches.push(data[m - width].index);
                final.push(data[m - width].index);
            }
            if (
                m < ((width * height) - width)
                && data[m + width].color == matchColor
                && final.indexOf(data[m + width].index) == -1
            ) {
                newMatches.push(data[m + width].index);
                final.push(data[m + width].index);
            }
        }
        if (newMatches.length == 0) {
            finished = true;
        }
        matches = newMatches;

    }
    console.log("final", final.length);
    return final;
}

function MapOverlay(bounds, image, map) {

    // Initialize all properties.
    this.bounds_ = bounds;
    this.image_ = image;
    this.map_ = map;

    this.div_ = null;

    this.setMap(map);

    MapOverlay.prototype.onAdd = function () {

        var div = document.createElement('div');
        div.style.borderStyle = 'none';
        div.style.borderWidth = '0px';
        div.style.position = 'absolute';
        div.style.zIndex = -1;
        div.style.opacity = 0.9992;


        var img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.src = this.image_;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.position = 'absolute';
        img.style.top = 0;
        img.style.left = 0;
        div.appendChild(img);

        this.div_ = div;
        google.maps.event.addDomListener(this.div_, 'click', (e) => {
            const sw = this.bounds_.getSouthWest();
            const ne = this.bounds_.getNorthEast();

            const c = document.createElement("canvas");
            c.width = img.width;
            c.height = img.height;
            const context = c.getContext("2d");
            context.drawImage(img, 0, 0, c.width, c.height);

            const data = context.getImageData(0, 0, c.width, c.height).data;
            console.log("Width of Image", c.width);

            const dataMapped = [];
            let point;
            console.log("Mapping Image data");
            for (let i = 0; i < data.length; i = i + 4) {
                const dataObj = {
                    x: (i / 4) % c.width,
                    y: Math.ceil((i / 4) / c.width),
                    color: JSON.stringify([data[i], data[i + 1], data[i + 2], data[i + 3]]),
                    index: (i / 4)
                };
                if (dataObj.x == e.layerX && dataObj.y == e.layerY) {
                    point = dataObj;
                }
                dataMapped.push(dataObj);
            }
            console.log("Starting MagicWand algorithm");
            const result = awesomeSelection(dataMapped, point, c.width, c.height);
            console.log("MagicWand algorithm ended");

            const coords = [];
            console.log("Started mapping values to lat/lng");
            for (let i of result) {
                const coord = { x: i % c.width, y: Math.ceil(i / c.width) };
                const yInc = awesomefunc(ne.lat(), sw.lat(), c.height, coord.y);
                const xInc = awesomefunc(sw.lng(), ne.lng(), c.width, coord.x);
                coords.push({ x: xInc, y: yInc });
            }
            console.log("Ended. Drawing polygon");
            const polygonPaths = coords.map(c => new google.maps.LatLng(c.y, c.x));
            const stuff = coords.map(s => turf.point([s.y, s.x]));
            const turfPoly = turf.featureCollection(stuff);
            //const stuff1 = turf.concave(turfPoly, { maxEdge: 0.02 });
            const stuff1 = turf.convex(turfPoly, { concavity: 0.1 });
            console.log(turfPoly);
            console.log(stuff1);
            const polyPaths = stuff1.geometry.coordinates[0].map(coords => new google.maps.LatLng(coords[0], coords[1]));
            new google.maps.Polygon({ paths: polyPaths, map });
            console.log("Drawing Polygon complete. Amount of items after calling turf method", polyPaths.length);
            //new google.maps.Polygon({ paths: polygonPaths, map });
            //polygonPaths.forEach(p => new google.maps.Marker({ position: p, map }));
            var panes = this.getPanes();
            panes.overlayLayer.appendChild(div);



        });
        /* 
            Changing pane in order to make DOM click events work 
            ====================================================
            OverlayLayer contains polylines, polygons, ground overlays and tile layer overlays. It may not receive DOM events. (Pane 1). 
            https://developers.google.com/maps/documentation/javascript/reference/3.exp/overlay-view#MapPanes
        */
        var panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
    };

    MapOverlay.prototype.draw = function () {
        var overlayProjection = this.getProjection();
        var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
        var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

        // Resize the image's div to fit the indicated dimensions.
        var div = this.div_;
        div.style.left = sw.x + 'px';
        div.style.top = ne.y + 'px';
        div.style.width = (ne.x - sw.x) + 'px';
        div.style.height = (sw.y - ne.y) + 'px';
    };

    MapOverlay.prototype.onRemove = function () {
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
    };
}

export default class MapOverlayCustom extends PureComponent {

    componentDidMount() {
        MapOverlay.prototype = new google.maps.OverlayView();
        const coords = new google.maps.LatLngBounds(this.props.coords.sw, this.props.coords.ne);
        const srcImage = this.props.url;
        new MapOverlay(coords, srcImage, this.props.map);
    }


    render() {
        return <div />;
    }
}