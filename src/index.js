import { BackgroundLayer } from './layers/background-layer/BackgroundLayer.js'
import MapController from './controllers/MapController.js'
import ParticlesLayer from './layers/particles-layer/ParticlesLayer.js'

let mapController = new MapController()

let backgroundLayer = new BackgroundLayer()
let particlesLayer = new ParticlesLayer()

mapController.leaflet.addLayer(backgroundLayer)
mapController.leaflet.addLayer(particlesLayer)

mapController.leaflet.on('resize', () => {
    backgroundLayer.resize()
    particlesLayer.resize()
})
mapController.leaflet.on('movestart', () => {
    tickOn = false
})
mapController.leaflet.on('move', () => {
    tickOn = false

    particlesLayer.clear()
    backgroundLayer.reposition()
    particlesLayer.reposition()

    backgroundLayer.repaint()
})
mapController.leaflet.on('moveend', () => {
    tickOn = true
})

function tick() {
    if (tickOn) {
        if (particlesLayer.loaded)
            particlesLayer.render()
    }

    window.requestAnimationFrame(tick)
}

let tickOn = true

tick()

