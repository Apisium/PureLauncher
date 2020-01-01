const { MOUSE, DoubleSide, FrontSide, NearestFilter } = require('three/src/constants')
const W = require('three/src/renderers/WebGLRenderer').WebGLRenderer

Object.defineProperty(W.prototype, 'context', { get () { return this.getContext() } })

exports.WebGLRenderer = W
exports.MOUSE = MOUSE
exports.DoubleSide = DoubleSide
exports.FrontSide = FrontSide
exports.NearestFilter = NearestFilter
exports.Object3D = require('three/src/core/Object3D').Object3D
exports.BoxGeometry = require('three/src/geometries/BoxGeometry').BoxGeometry
exports.MeshBasicMaterial = require('three/src/materials/MeshBasicMaterial').MeshBasicMaterial
exports.Vector2 = require('three/src/math/Vector2').Vector2
exports.Group = require('three/src/objects/Group').Group
exports.Mesh = require('three/src/objects/Mesh').Mesh
exports.Clock = require('three/src/core/Clock').Clock
exports.Camera = require('three/src/cameras/Camera').Camera
exports.OrthographicCamera = require('three/src/cameras/OrthographicCamera').OrthographicCamera
exports.PerspectiveCamera = require('three/src/cameras/PerspectiveCamera').PerspectiveCamera
exports.EventDispatcher = require('three/src/core/EventDispatcher').EventDispatcher
exports.Quaternion = require('three/src/math/Quaternion').Quaternion
exports.Spherical = require('three/src/math/Spherical').BoxGeometry
exports.Vector3 = require('three/src/math/Vector3').Vector3
exports.Spherical = require('three/src/math/Spherical').Spherical
exports.Scene = require('three/src/scenes/Scene').Scene
exports.Texture = require('three/src/textures/Texture').Texture
