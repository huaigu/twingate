'use client'

import { useEffect, useRef, useState } from 'react'

type SceneState = 'loading' | 'ready' | 'fallback'

/** Illustrative agent personas; these are sculptures, never identity credentials. */
export default function PersonaScene({ phase = 0 }: { phase?: number }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)
  const redrawRef = useRef<(() => void) | null>(null)
  const [state, setState] = useState<SceneState>('loading')

  useEffect(() => {
    phaseRef.current = phase
    redrawRef.current?.()
  }, [phase])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let cleanupScene: (() => void) | undefined

    async function createScene() {
      try {
        const [THREE, { RoundedBoxGeometry }, { RoomEnvironment }] = await Promise.all([
          import('three'),
          import('three/addons/geometries/RoundedBoxGeometry.js'),
          import('three/addons/environments/RoomEnvironment.js'),
        ])
        if (cancelled || !host) return

        const canvas = document.createElement('canvas')
        // This is an on-demand scene. Keep its last frame when the browser
        // recomposites it after a resize, screenshot, or return to the viewport.
        const context = canvas.getContext('webgl2', {
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'low-power',
        })
        if (!context) {
          setState('fallback')
          return
        }
        const renderer = new THREE.WebGLRenderer({
          canvas,
          context,
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'low-power',
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.98
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.domElement.setAttribute('aria-hidden', 'true')
        renderer.domElement.className = 'persona-scene__canvas'
        Object.assign(renderer.domElement.style, {
          width: '100%',
          height: '100%',
          display: 'block',
        })
        host.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-3, 3, 2.6, -2.6, 0.1, 60)
        camera.position.set(4.4, 3.8, 11)
        camera.lookAt(0, 1.45, 0)
        const studio = new RoomEnvironment()
        const pmrem = new THREE.PMREMGenerator(renderer)
        const environment = pmrem.fromScene(studio, 0.04)
        scene.environment = environment.texture
        scene.environmentIntensity = 0.7
        studio.dispose()
        pmrem.dispose()

        const geometries = new Set<import('three').BufferGeometry>()
        const materials = new Set<import('three').Material>()
        const geometry = <T extends import('three').BufferGeometry>(value: T): T => {
          geometries.add(value)
          return value
        }
        const material = (color: string, roughness = 0.28, metalness = 0.04) => {
          const value = new THREE.MeshPhysicalMaterial({
            color,
            roughness,
            metalness,
            clearcoat: 0.5,
            clearcoatRoughness: 0.22,
          })
          materials.add(value)
          return value
        }
        const blue = material('#244bea', 0.25)
        const softBlue = material('#9cb8f5', 0.3)
        const lavender = material('#bcb8f1', 0.33)
        const orange = material('#f4a267', 0.32)
        const peach = material('#fac599', 0.32)
        const cream = material('#fffae9', 0.27)
        const ink = material('#202842', 0.3)
        const darkBlue = material('#173ba5', 0.32)
        const chrome = material('#e5f0ff', 0.13, 0.85)

        const sphereGeometry = geometry(new THREE.SphereGeometry(1, 40, 28))
        const capsuleGeometry = geometry(new THREE.CapsuleGeometry(0.5, 1, 10, 28))

        function mesh(
          parent: import('three').Object3D,
          shape: import('three').BufferGeometry,
          surface: import('three').Material,
          position: [number, number, number],
          scale: [number, number, number] = [1, 1, 1],
        ) {
          const object = new THREE.Mesh(shape, surface)
          object.position.set(...position)
          object.scale.set(...scale)
          object.castShadow = true
          object.receiveShadow = true
          parent.add(object)
          return object
        }

        function roundBox(width: number, height: number, depth: number, radius: number) {
          return geometry(new RoundedBoxGeometry(width, height, depth, 5, radius))
        }

        function limb(
          parent: import('three').Object3D,
          surface: import('three').Material,
          from: [number, number, number],
          to: [number, number, number],
          radius: number,
        ) {
          const start = new THREE.Vector3(...from)
          const end = new THREE.Vector3(...to)
          const direction = end.clone().sub(start)
          const object = mesh(
            parent,
            capsuleGeometry,
            surface,
            [0, 0, 0],
            [radius * 2, direction.length() / 2, radius * 2],
          )
          object.position.copy(start.add(end).multiplyScalar(0.5))
          object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
          return object
        }

        function eye(parent: import('three').Object3D, x: number, y: number, z: number) {
          const object = mesh(parent, sphereGeometry, ink, [x, y, z], [0.055, 0.094, 0.034])
          mesh(object, sphereGeometry, cream, [-0.23, 0.32, 0.9], [0.24, 0.19, 0.2])
        }

        function smile(
          parent: import('three').Object3D,
          x: number,
          y: number,
          z: number,
          size = 0.105,
        ) {
          const arc = geometry(new THREE.TorusGeometry(size, 0.018, 8, 28, Math.PI * 0.75))
          const object = mesh(parent, arc, ink, [x, y, z])
          object.rotation.z = Math.PI * 1.125
        }

        const stage = new THREE.Group()
        scene.add(stage)

        const left = new THREE.Group()
        left.position.set(-1.04, 0.06, 0.07)
        left.rotation.set(0, 0.14, -0.065)
        stage.add(left)

        // A generous, rounded silhouette with an inset ceramic face and real headphones.
        mesh(left, roundBox(1.1, 1.13, 0.77, 0.33), blue, [0, 1.16, 0])
        mesh(left, roundBox(1.25, 1.24, 0.92, 0.4), blue, [0, 2.06, 0.025])
        mesh(left, roundBox(0.98, 0.79, 0.08, 0.3), cream, [0, 2.09, 0.472])
        eye(left, -0.205, 2.13, 0.531)
        eye(left, 0.205, 2.13, 0.531)
        smile(left, 0.02, 1.96, 0.531)

        const headband = mesh(
          left,
          geometry(new THREE.TorusGeometry(0.665, 0.075, 12, 48, Math.PI)),
          softBlue,
          [0, 2.08, 0.01],
        )
        headband.scale.y = 1.08
        mesh(left, roundBox(0.21, 0.5, 0.44, 0.105), darkBlue, [-0.668, 2.05, 0.02])
        mesh(left, roundBox(0.21, 0.5, 0.44, 0.105), darkBlue, [0.668, 2.05, 0.02])
        mesh(left, roundBox(0.115, 0.4, 0.31, 0.055), lavender, [-0.787, 2.05, 0.025])
        mesh(left, roundBox(0.115, 0.4, 0.31, 0.055), lavender, [0.787, 2.05, 0.025])

        limb(left, blue, [-0.45, 1.38, 0], [-0.73, 0.95, 0.21], 0.175)
        mesh(left, sphereGeometry, softBlue, [-0.77, 0.79, 0.27], [0.19, 0.205, 0.2])
        limb(left, blue, [0.44, 1.35, 0], [0.68, 1.04, 0.27], 0.17)
        limb(left, blue, [0.64, 1.07, 0.23], [0.86, 1.37, 0.39], 0.17)
        const leftHand = mesh(
          left,
          sphereGeometry,
          softBlue,
          [0.94, 1.48, 0.42],
          [0.21, 0.16, 0.205],
        )
        leftHand.rotation.z = 0.3
        mesh(left, sphereGeometry, softBlue, [0.81, 1.57, 0.39], [0.087, 0.12, 0.105])

        limb(left, darkBlue, [-0.26, 0.78, 0], [-0.29, 0.3, 0.05], 0.2)
        limb(left, darkBlue, [0.26, 0.78, 0], [0.31, 0.3, 0.05], 0.2)
        const leftBoot = mesh(left, roundBox(0.47, 0.3, 0.72, 0.15), cream, [-0.3, 0.2, 0.18])
        leftBoot.rotation.y = 0.13
        const rightBoot = mesh(left, roundBox(0.47, 0.3, 0.72, 0.15), cream, [0.31, 0.2, 0.18])
        rightBoot.rotation.y = -0.13
        mesh(left, roundBox(0.33, 0.05, 0.075, 0.022), softBlue, [-0.3, 0.35, 0.3])
        mesh(left, roundBox(0.33, 0.05, 0.075, 0.022), softBlue, [0.31, 0.35, 0.3])

        // The second persona has a different shape, posture, and warm material family.
        const right = new THREE.Group()
        right.position.set(1.14, 0.04, -0.18)
        right.rotation.set(0, -0.23, 0.075)
        stage.add(right)
        mesh(right, sphereGeometry, orange, [0, 1.13, 0], [0.7, 0.81, 0.47])
        mesh(right, roundBox(1.21, 1.07, 0.88, 0.41), peach, [0, 2.0, 0.01])
        const crown = mesh(right, roundBox(0.38, 0.34, 0.42, 0.16), orange, [-0.1, 2.565, 0])
        crown.rotation.z = -0.32
        mesh(right, roundBox(0.95, 0.66, 0.075, 0.24), cream, [0, 2.0, 0.44])
        eye(right, -0.18, 2.065, 0.495)
        eye(right, 0.18, 2.065, 0.495)
        smile(right, -0.01, 1.92, 0.495, 0.09)
        mesh(right, sphereGeometry, orange, [-0.64, 2.025, 0], [0.11, 0.19, 0.2])
        mesh(right, sphereGeometry, orange, [0.64, 2.025, 0], [0.11, 0.19, 0.2])

        limb(right, orange, [0.52, 1.4, 0], [0.79, 1.06, 0.19], 0.16)
        mesh(right, sphereGeometry, peach, [0.84, 0.94, 0.23], [0.19, 0.205, 0.19])
        limb(right, orange, [-0.51, 1.38, 0], [-0.68, 1.08, 0.22], 0.17)
        limb(right, orange, [-0.67, 1.09, 0.2], [-0.83, 1.42, 0.4], 0.17)
        const rightHand = mesh(
          right,
          sphereGeometry,
          peach,
          [-0.91, 1.5, 0.43],
          [0.22, 0.15, 0.205],
        )
        rightHand.rotation.z = -0.3
        mesh(right, sphereGeometry, peach, [-0.8, 1.61, 0.41], [0.095, 0.11, 0.095])

        limb(right, orange, [-0.28, 0.64, 0], [-0.29, 0.3, 0.04], 0.205)
        limb(right, orange, [0.27, 0.64, 0], [0.32, 0.3, 0.04], 0.205)
        const warmLeftBoot = mesh(
          right,
          roundBox(0.47, 0.29, 0.68, 0.145),
          cream,
          [-0.29, 0.19, 0.19],
        )
        warmLeftBoot.rotation.y = 0.12
        const warmRightBoot = mesh(
          right,
          roundBox(0.47, 0.29, 0.68, 0.145),
          cream,
          [0.32, 0.19, 0.19],
        )
        warmRightBoot.rotation.y = -0.12

        // One physical object passing between the agents makes the introduction tangible.
        const token = new THREE.Group()
        token.position.set(-0.11, 1.74, 0.64)
        stage.add(token)
        mesh(token, sphereGeometry, cream, [0, 0, 0], [0.215, 0.215, 0.215])
        const orbit = mesh(
          token,
          geometry(new THREE.TorusGeometry(0.237, 0.027, 12, 44)),
          chrome,
          [0, 0, 0],
        )
        orbit.rotation.set(1.12, 0.42, 0.2)

        const plinthSurface = material('#d9e7fc', 0.65)
        const plinth = mesh(
          stage,
          geometry(new THREE.CylinderGeometry(2.2, 2.24, 0.13, 96)),
          plinthSurface,
          [0.01, 0.025, 0],
        )
        plinth.scale.z = 0.68
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.13 })
        materials.add(groundMaterial)
        const floor = mesh(
          scene,
          geometry(new THREE.PlaneGeometry(200, 200)),
          groundMaterial,
          [0, -0.05, 0],
        )
        floor.rotation.x = -Math.PI / 2
        floor.castShadow = false

        scene.add(new THREE.HemisphereLight(0xf8f5ff, 0xd0dcf7, 2.0))
        const key = new THREE.DirectionalLight(0xfffaf3, 3.2)
        key.position.set(-3.5, 7, 5)
        key.castShadow = true
        key.shadow.mapSize.set(1024, 1024)
        key.shadow.camera.left = -5
        key.shadow.camera.right = 5
        key.shadow.camera.top = 5
        key.shadow.camera.bottom = -5
        key.shadow.normalBias = 0.025
        key.shadow.bias = -0.0002
        key.shadow.radius = 4
        scene.add(key)
        const rim = new THREE.DirectionalLight(0xe3ecff, 2)
        rim.position.set(4, 4, -3)
        scene.add(rim)

        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        let visible = true
        let frame = 0
        let lastFrame = 0
        let pointerX = 0
        let pointerY = 0
        let currentX = 0
        let currentY = 0
        let currentPhase = phaseRef.current
        let disposed = false
        let renderedWidth = 0
        let renderedHeight = 0

        function requestFrame() {
          if (!frame && !disposed && visible && !document.hidden)
            frame = window.requestAnimationFrame(render)
        }

        function render(time: number) {
          frame = 0
          if (disposed || !visible || document.hidden) return
          if (time - lastFrame < 32) {
            requestFrame()
            return
          }
          const damping = motion.matches ? 1 : 1 - Math.exp(-Math.min(time - lastFrame, 64) / 130)
          lastFrame = time
          currentX += (pointerX - currentX) * damping
          currentY += (pointerY - currentY) * damping
          currentPhase += (phaseRef.current - currentPhase) * damping
          stage.rotation.y = currentX * 0.09
          stage.rotation.x = currentY * 0.035
          left.rotation.y = 0.14 + currentPhase * 0.045
          right.rotation.y = -0.23 - currentPhase * 0.04
          token.position.x = -0.11 + currentPhase * 0.12
          token.position.y = 1.74 + Math.sin((currentPhase * Math.PI) / 2) * 0.11
          token.rotation.y = currentPhase * 0.8
          renderer.render(scene, camera)
          if (
            Math.abs(pointerX - currentX) +
              Math.abs(pointerY - currentY) +
              Math.abs(phaseRef.current - currentPhase) >
            0.001
          )
            requestFrame()
        }

        function resize() {
          const width = host!.clientWidth
          const height = host!.clientHeight
          if (!width || !height || disposed) return
          if (width === renderedWidth && height === renderedHeight) return
          renderedWidth = width
          renderedHeight = height
          renderer.setSize(width, height, false)
          const aspect = width / height
          const viewHeight = Math.max(4.35, 5.4 / aspect)
          camera.left = (-viewHeight * aspect) / 2
          camera.right = (viewHeight * aspect) / 2
          camera.top = viewHeight / 2
          camera.bottom = -viewHeight / 2
          camera.updateProjectionMatrix()
          // setSize clears the backing buffer. Draw immediately even when the
          // intersection observer still has the visibility of the old layout.
          renderer.render(scene, camera)
          requestFrame()
        }

        function onPointerMove(event: PointerEvent) {
          if (motion.matches || event.pointerType === 'touch') return
          const bounds = host!.getBoundingClientRect()
          pointerX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
          pointerY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1
          requestFrame()
        }

        function resetPointer() {
          pointerX = 0
          pointerY = 0
          requestFrame()
        }

        function onVisibilityChange() {
          if (document.hidden) {
            window.cancelAnimationFrame(frame)
            frame = 0
          } else requestFrame()
        }

        function onContextLost(event: Event) {
          event.preventDefault()
          cleanupScene?.()
          setState('fallback')
        }

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(host)
        const intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? false
          if (visible) requestFrame()
          else {
            window.cancelAnimationFrame(frame)
            frame = 0
          }
        })
        intersectionObserver.observe(host)
        host.addEventListener('pointermove', onPointerMove)
        host.addEventListener('pointerleave', resetPointer)
        document.addEventListener('visibilitychange', onVisibilityChange)
        motion.addEventListener('change', resetPointer)
        renderer.domElement.addEventListener('webglcontextlost', onContextLost)
        redrawRef.current = requestFrame

        cleanupScene = () => {
          disposed = true
          redrawRef.current = null
          window.cancelAnimationFrame(frame)
          resizeObserver.disconnect()
          intersectionObserver.disconnect()
          host.removeEventListener('pointermove', onPointerMove)
          host.removeEventListener('pointerleave', resetPointer)
          document.removeEventListener('visibilitychange', onVisibilityChange)
          motion.removeEventListener('change', resetPointer)
          renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
          geometries.forEach((item) => item.dispose())
          materials.forEach((item) => item.dispose())
          environment.dispose()
          key.shadow.map?.dispose()
          renderer.dispose()
          renderer.forceContextLoss()
          renderer.domElement.remove()
        }
        resize()
        if (!cancelled) setState('ready')
      } catch {
        cleanupScene?.()
        if (!cancelled) setState('fallback')
      }
    }

    void createScene()
    return () => {
      cancelled = true
      cleanupScene?.()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      className="persona-scene"
      data-scene-state={state}
      role="img"
      aria-label="Illustrative 3D agent personas: a blue ceramic figure and an apricot figure exchanging a small introduction token. These are synthetic demonstration characters."
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {state !== 'ready' && (
        <div
          className="persona-scene__fallback"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '7%',
            paddingBottom: '10%',
          }}
        >
          <div
            style={{
              width: '25%',
              height: '43%',
              borderRadius: '44% 44% 35% 35%',
              background: '#244bea',
              transform: 'rotate(-8deg)',
              boxShadow: '12px 22px 30px #244bea20',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '19%',
                left: '15%',
                right: '15%',
                height: '31%',
                borderRadius: '30px',
                background: '#fff9e9',
                display: 'flex',
                justifyContent: 'space-evenly',
                alignItems: 'center',
              }}
            >
              <i style={{ width: 7, height: 13, borderRadius: 8, background: '#202842' }} />
              <i style={{ width: 7, height: 13, borderRadius: 8, background: '#202842' }} />
            </span>
          </div>
          <div
            style={{
              width: '25%',
              height: '40%',
              borderRadius: '44% 44% 40% 40%',
              background: '#f5a365',
              transform: 'rotate(8deg)',
              boxShadow: '12px 22px 30px #a8703620',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '19%',
                left: '15%',
                right: '15%',
                height: '31%',
                borderRadius: '30px',
                background: '#fff9e9',
                display: 'flex',
                justifyContent: 'space-evenly',
                alignItems: 'center',
              }}
            >
              <i style={{ width: 7, height: 13, borderRadius: 8, background: '#202842' }} />
              <i style={{ width: 7, height: 13, borderRadius: 8, background: '#202842' }} />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
