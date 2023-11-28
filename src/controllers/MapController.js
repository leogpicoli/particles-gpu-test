import { textureBounds } from '../layers/background-layer/BackgroundLayer.js'

export default class MapController {
    constructor() {
        this.leaflet = L.map('map', {
            center: [39, 7], // Mediterranean Sea
            zoom: 6,
            minZoom: 6,
            maxZoom: 10,
            maxBounds: textureBounds,
            layers: [L.tileLayer('https://tiles.windy.com/tiles/v9.0/grayland/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }), L.tileLayer('https://tiles.windy.com/tiles/v10.0/darkmap-retina/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            })],
        });

        this.portMarkers = []
    }

    leafletInfo() {
        const zoom = this.leaflet.getZoom()

        const leafletInfo = {
            mapPanePos: L.DomUtil.getPosition(this.leaflet.getPane('mapPane')),
            mapOriginPos: this.leaflet.getPixelOrigin(),
            mapSize: { x: window.innerWidth, y: window.innerHeight },//this.leaflet.getSize(),
            zoom: zoom,
            scale: 256 * Math.pow(2, zoom)
        }

        console.log(leafletInfo)

        return leafletInfo
    }
}