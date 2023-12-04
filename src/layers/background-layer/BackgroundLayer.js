import * as THREE from 'three'
import vertexShaderText from './shaders/vertex.glsl'
import fragmentShaderText from './shaders/fragment.glsl'
import { currentsInfo } from '../particles-layer/ParticlesLayer'

const TEXTURE_COLORS = [
    { m: 0.0, color: { r: 64, g: 77, b: 144 } },
    { m: 0.2, color: { r: 61, g: 121, b: 110 } },
    { m: 0.4, color: { r: 50, g: 140, b: 50 } },
    { m: 0.6, color: { r: 140, g: 133, b: 49 } },
    { m: 0.8, color: { r: 143, g: 115, b: 50 } },
    { m: 1.2, color: { r: 117, g: 52, b: 68 } },
    { m: 1.6, color: { r: 107, g: 67, b: 131 } },
    { m: 1.8, color: { r: 67, g: 93, b: 133 } },
    { m: 2.0, color: { r: 73, g: 122, b: 132 } },
    { m: 2.4, color: { r: 115, g: 135, b: 139 } },
    { m: 2.8, color: { r: 144, g: 144, b: 144 } },
]

export const textureBounds = L.latLngBounds(
    L.latLng(currentsInfo.sw.lat, currentsInfo.sw.lon),
    L.latLng(currentsInfo.ne.lat, currentsInfo.ne.lon)
)

const textureColors = TEXTURE_COLORS.map(obj => {
    return {
        m: obj.m,
        color: new THREE.Vector3(obj.color.r, obj.color.g, obj.color.b)
    }
})

export const BackgroundLayer = L.Layer.extend({
    _map: null,
    _canvas: null,
    _threejs: null,
    _camera: null,
    _scene: null,
    _material: null,
    _clock: null,

    onAdd: async function (map) {
        this._threejs = new THREE.WebGLRenderer({
            antialias: true,
        })
        this._threejs.setPixelRatio(Math.min(2, window.devicePixelRatio))
        this._threejs.setSize(window.innerWidth, window.innerHeight)
        this._map = map

        const pane = map.createPane('background-pane')
        pane.style.zIndex = 100
        pane.appendChild(this._threejs.domElement)
        // map.getPane('overlayPane').appendChild(this._threejs.domElement)

        this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1000)
        this._camera.position.set(0, 0, 1)

        this._scene = new THREE.Scene()

        this._clock = new THREE.Clock()

        const currentsTexture = await this._loadTexture()

        this._material = this._createMaterial(currentsTexture)

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this._material)
        plane.position.set(0.5, 0.5, 0)

        this._scene.add(plane)

        this.reposition()
        this.repaint()
    },
    onRemove: function () {
        /** TODO */
        console.warn('TODO onRemove BackgroundLayer')
    },
    _loadTexture: async function () {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader()
            loader.load('data/currents.png', (texture) => {
                resolve(texture)
            })
        })
    },
    _createMaterial: function (currentsTexture) {
        const vertexShader = vertexShaderText
        const fragmentShader = `#define COLORS_LENGTH ${textureColors.length}\n` + fragmentShaderText

        return new THREE.ShaderMaterial({
            uniforms: {
                currents: { value: currentsTexture },

                time: { value: 0.0 },
                scale: { value: 0.0 },


                minCurrent: { value: new THREE.Vector3(currentsInfo.u.min, currentsInfo.v.min, currentsInfo.m.min) },
                maxCurrent: { value: new THREE.Vector3(currentsInfo.u.max, currentsInfo.v.max, currentsInfo.m.max) },
                southWestLimit: { value: new THREE.Vector2(currentsInfo.sw.lon, currentsInfo.sw.lat) },
                northEastLimit: { value: new THREE.Vector2(currentsInfo.ne.lon, currentsInfo.ne.lat) },

                mapPane: { value: new THREE.Vector2(0.0, 0.0) },
                mapOrigin: { value: new THREE.Vector2(0.0, 0.0) },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },

                readFromTexture: { value: true },
                defaultColor: { value: new THREE.Vector3(64, 77, 144) },
                textureColors: { value: textureColors },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        })
    },
    reposition: function () {
        // Update canvas position
        L.DomUtil.setPosition(
            this._threejs.domElement,
            this._map.containerPointToLayerPoint([0, 0])
        )

        const mapPanePos = L.DomUtil.getPosition(this._map.getPane('mapPane'))
        const mapOriginPos = this._map.getPixelOrigin()
        const zoom = this._map.getZoom()
        const scale = 256 * Math.pow(2, zoom)

        this._material.uniforms.scale.value = scale
        this._material.uniforms.mapPane.value = new THREE.Vector2(mapPanePos.x, mapPanePos.y)
        this._material.uniforms.mapOrigin.value = new THREE.Vector2(mapOriginPos.x, mapOriginPos.y)
        this._material.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    resize: function () {
        this._threejs.setSize(window.innerWidth, window.innerHeight)
        this.repaint()
    },
    repaint: function () {
        if (this._material)
            this._material.uniforms.time.value = this._clock.getElapsedTime()
        this._threejs.render(this._scene, this._camera)
    },
    setReadFromTexture: function (readT) {
        this._material.uniforms.readFromTexture.value = readT
        this.repaint()
    },
    setDefaultColor: function (color) {
        this._material.uniforms.defaultColor.value = new THREE.Vector3(color.r, color.g, color.b)
    }
})