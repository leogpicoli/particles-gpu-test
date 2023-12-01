import * as THREE from 'three'
import drawParticlesVertexShader from './shaders/draw/vertex.glsl'
import drawParticlesFragmentShader from './shaders/draw/fragment.glsl'

import updateParticlesVertexShader from './shaders/update/vertex.glsl'
import updateParticlesFragmentShader from './shaders/update/fragment.glsl'

import decayVertexShader from './shaders/decay/vertex.glsl'
import decayFragmentShader from './shaders/decay/fragment.glsl'

import screenVertexShader from './shaders/screen/vertex.glsl'
import screenFragmentShader from './shaders/screen/fragment.glsl'

export const currentsInfo = {
    width: 2322,
    height: 885,
    u: {
        min: -1.307664394378662,
        max: 1.3892103433609009
    },
    v: {
        min: -1.374261736869812,
        max: 1.3809068202972412
    },
    sw: {
        lat: 30.000852584838867,
        lon: -5.492567539215088
    },
    ne: {
        lat: 45.99583435058594,
        lon: 36.49912643432617
    }
}

const ParticlesLayer = L.Layer.extend({
    _map: null,
    _canvas: null,
    _renderer: null,
    _camera: null,
    _scene: null,
    _material: null,
    _clock: null,
    loaded: false,

    onAdd: async function (map) {
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: Math.min(window.devicePixelRatio, 2)
        }

        this.particlesRes = 50

        this._screenGeometry = new THREE.PlaneGeometry(2, 2);

        this._numParticles = this.particlesRes * this.particlesRes

        this.particlesOpacity = 0.99

        this._particlesTexture = this._initParticlesTexture()
        this._currentsTexture = await this._initCurrentsTexture('data/currents.png')

        this._particlesUpdateRenderTarget = this._initParticlesUpdateRenderTarget()
        this._screenRenderTarget = this._initScreenRenderTarget()

        this._scene = new THREE.Scene()
        this._decayScene = new THREE.Scene()

        this._particlesUpdateScene = new THREE.Scene()
        this._particlesDrawScene = new THREE.Scene()

        this._initParticlesDrawScene();
        this._initParticlesUpdateScene();
        this._initScreenScene();
        this._initDecayScene();

        this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        this._clock = new THREE.Clock()

        this.frame = 0

        this._map = map

        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
        })
        this._renderer.setPixelRatio(this.sizes.pixelRatio)
        this._renderer.setSize(this.sizes.width, this.sizes.height)

        const pane = this._map.createPane('particles-pane')
        pane.style.zIndex = 110
        pane.appendChild(this._renderer.domElement)

        this.loaded = true
        this.reposition()
        // this.render()
    },
    onRemove: function () { },
    _initParticlesUpdateRenderTarget: function () {
        const particlesUpdateRenderTarget0 = new THREE.WebGLRenderTarget(
            this.particlesRes,
            this.particlesRes,
            {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
            }
        )

        const particlesUpdateRenderTarget1 = particlesUpdateRenderTarget0.clone()
        particlesUpdateRenderTarget1.texture = this._particlesTexture

        return {
            0: particlesUpdateRenderTarget0,
            1: particlesUpdateRenderTarget1,
            current: particlesUpdateRenderTarget0
        }
    },
    _initScreenRenderTarget: function () {
        const screenRenderTarget0 = new THREE.WebGLRenderTarget(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
        )
        const screenRenderTarget1 = screenRenderTarget0.clone()

        return {
            0: screenRenderTarget0,
            1: screenRenderTarget1,
            current: screenRenderTarget1
        }
    },
    _initCurrentsTexture: function (file) {
        const textureLoader = new THREE.TextureLoader()
        return new Promise((resolve, reject) => {
            textureLoader.load(file, (texture) => {
                texture.magFilter = THREE.NearestFilter
                texture.minFilter = THREE.NearestFilter

                resolve(texture);
            })
        })
    },
    _initParticlesTexture: function () {
        const data = new Uint8Array(4 * this._numParticles)
        for (let i = 0; i < this._numParticles; i++) {
            const stride = i * 4;
            data[stride + 0] = Math.floor(Math.random() * 255)
            data[stride + 1] = Math.floor(Math.random() * 255)
            data[stride + 2] = Math.floor(Math.random() * 255)
            data[stride + 3] = Math.floor(Math.random() * 255)
        }
        const particlesTexture = new THREE.DataTexture(data, this.particlesRes, this.particlesRes);
        particlesTexture.needsUpdate = true;
        return particlesTexture;
    },
    _initParticlesDrawScene: function () {
        // Geometry
        const particlesDrawGeometry = new THREE.BufferGeometry()
        const particlesIndices = new Float32Array(this._numParticles)
        for (let i = 0; i < this._numParticles; i++) {
            particlesIndices[i] = i
        }
        particlesDrawGeometry.setAttribute('a_ParticleIndex', new THREE.BufferAttribute(particlesIndices, 1))

        /** Need to add position attribute to Three.js even though we don't use it */
        const positionAttribute = new THREE.BufferAttribute(new Float32Array(this._numParticles * 3), 3);
        positionAttribute.setUsage(THREE.StaticCopyUsage);
        particlesDrawGeometry.setAttribute('position', positionAttribute);

        // Material
        this._particlesDrawMaterial = new THREE.ShaderMaterial({
            vertexShader: drawParticlesVertexShader,
            fragmentShader: drawParticlesFragmentShader,
            uniforms: {
                u_ParticlesTexture: { value: this._particlesUpdateRenderTarget.current.texture },
                u_ParticlesRes: { value: this.particlesRes },
            },
            transparent: false
        })

        const points = new THREE.Points(particlesDrawGeometry, this._particlesDrawMaterial)
        this._particlesDrawScene.add(points)
    },
    _initParticlesUpdateScene: function () {
        const particlesUpdateGeometry = new THREE.PlaneGeometry(2, 2);
        this._particlesUpdateMaterial = new THREE.ShaderMaterial({
            vertexShader: updateParticlesVertexShader,
            fragmentShader: updateParticlesFragmentShader,
            uniforms: {
                u_ParticlesRes: { value: this.particlesRes },
                u_ParticlesTexture: { value: this._particlesTexture },
                u_Currents: { value: this._currentsTexture },
                u_MinCurrent: { value: new THREE.Vector2(currentsInfo.u.min, currentsInfo.v.min) },
                u_MaxCurrent: { value: new THREE.Vector2(currentsInfo.u.max, currentsInfo.v.max) },
                u_RandomSeed: { value: Math.random() },
                u_Resolution: { value: new THREE.Vector2(this.sizes.width, this.sizes.height) },
                u_MapScale: { value: 16384 },
                u_MapPane: { value: new THREE.Vector2(0, 0) },
                u_MapOrigin: { value: new THREE.Vector2(7743, 5892) },
                u_SouthWestLimit: { value: new THREE.Vector2(currentsInfo.sw.lon, currentsInfo.sw.lat) },
                u_NorthEastLimit: { value: new THREE.Vector2(currentsInfo.ne.lon, currentsInfo.ne.lat) },
            }
        })

        const particlesUpdateMesh = new THREE.Mesh(particlesUpdateGeometry, this._particlesUpdateMaterial)
        this._particlesUpdateScene.add(particlesUpdateMesh);
    },
    _initScreenScene: function () {
        this._screenMaterial = new THREE.ShaderMaterial({
            vertexShader: screenVertexShader,
            fragmentShader: screenFragmentShader,
            uniforms: {
                u_Screen: { value: this._screenRenderTarget.current.texture },
                u_Opacity: { value: 1.0 },
            },
            depthWrite: false,
            transparent: true,
        })
        const screenMesh = new THREE.Mesh(this._screenGeometry, this._screenMaterial)
        this._scene.add(screenMesh)
    },
    _initDecayScene: function () {
        this._decayMaterial = new THREE.ShaderMaterial({
            vertexShader: decayVertexShader,
            fragmentShader: decayFragmentShader,
            uniforms: {
                u_Screen: { value: this._screenRenderTarget.current.texture },
                u_resolution: { value: new THREE.Vector2( //TODO: update when resize
                  this.sizes.width * this.sizes.pixelRatio,
                  this.sizes.height * this.sizes.pixelRatio
                  )}
            },
            depthWrite: false,
            transparent: true,
        })
        const decayMesh = new THREE.Mesh(this._screenGeometry, this._decayMaterial)
        this._decayScene.add(decayMesh)
    },

    reposition: function () {
        // Update canvas position
        L.DomUtil.setPosition(
            this._renderer.domElement,
            this._map.containerPointToLayerPoint([0, 0])
        )

        const mapPanePos = L.DomUtil.getPosition(this._map.getPane('mapPane'))
        const mapOriginPos = this._map.getPixelOrigin()
        const zoom = this._map.getZoom()
        const scale = 256 * Math.pow(2, zoom)

        this._particlesUpdateMaterial.uniforms.u_MapScale.value = scale
        this._particlesUpdateMaterial.uniforms.u_MapPane.value = new THREE.Vector2(mapPanePos.x, mapPanePos.y)
        this._particlesUpdateMaterial.uniforms.u_MapOrigin.value = new THREE.Vector2(mapOriginPos.x, mapOriginPos.y)
        this._particlesUpdateMaterial.uniforms.u_Resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    clear: function () {
        // this._screenMaterial.blending = THREE.NormalBlending
        this._renderer.setRenderTarget(this._screenRenderTarget[0])
        this._renderer.clear()

        this._renderer.setRenderTarget(this._screenRenderTarget[1])
        this._renderer.clear()

        this._renderer.setRenderTarget(null)
        this._renderer.clear()
    },
    resize: function () {
        this.sizes.width = window.innerWidth
        this.sizes.height = window.innerHeight
        this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

        // Update camera, do we need it?
        // camera.aspect = sizes.width / sizes.height
        // camera.updateProjectionMatrix()

        this._particlesUpdateMaterial.uniforms.u_Resolution.value = new THREE.Vector2(this.sizes.width, this.sizes.height)

        this._screenRenderTarget[0].setSize(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
        )
        this._screenRenderTarget[1].setSize(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
        )

        this._renderer.setSize(this.sizes.width, this.sizes.height)
        this._renderer.setPixelRatio(this.sizes.pixelRatio)
    },
    render: function () {
        // id of current target and id of previous target
        const idTarget = this.frame % 2
        const idPrev = 1 - idTarget

        // Swap render targets
        this._particlesUpdateRenderTarget.current = this._particlesUpdateRenderTarget[idTarget]
        this._screenRenderTarget.current = this._screenRenderTarget[idTarget]

        // Using texture from previous target to render new target
        this._particlesUpdateMaterial.uniforms.u_ParticlesTexture.value = this._particlesUpdateRenderTarget[idPrev].texture
        
        // Updating random seed to avoid particles degeneration
        this._particlesUpdateMaterial.uniforms.u_RandomSeed.value = Math.random()

        // Render physics update:
        this._renderer.setRenderTarget(this._particlesUpdateRenderTarget.current)
        this._renderer.render(this._particlesUpdateScene, this._camera)

        // render particles on texture (_screenRenderTarget):
        const screenTexture = this._screenRenderTarget[idPrev].texture
        this._decayMaterial.uniforms.u_Screen.value = screenTexture
        //screenTexture.minFilter = THREE.LinearFilter
        //screenTexture.magFilter = THREE.LinearFilter

        this._renderer.setRenderTarget(this._screenRenderTarget.current)
        this._renderer.autoClear = false
        this._renderer.setClearAlpha(0);
        this._renderer.clearColor();
        this._renderer.render(this._decayScene, this._camera) // draw previous particles
        this._renderer.render(this._particlesDrawScene, this._camera) // draw new particles


        // render to screen:
        this._screenMaterial.uniforms.u_Screen.value = this._screenRenderTarget[idPrev].texture
        this._screenMaterial.uniforms.u_Opacity.value = this.particlesOpacity
        //this._screenMaterial.blending = THREE.NoBlending
        //this._screenMaterial.uniforms.u_Opacity.value = 1.0
        this._renderer.setRenderTarget(null)
        this._renderer.autoClear = true
        this._renderer.setClearAlpha(0.0)
        this._renderer.render(this._scene, this._camera)

        this.frame++
    },
})

export default ParticlesLayer