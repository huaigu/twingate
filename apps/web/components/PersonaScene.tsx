'use client'

import { useEffect, useRef, useState } from 'react'

type SceneState = 'loading' | 'ready' | 'fallback'

/** Blender-authored hero scene. HTML copy remains above the model for a11y. */
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
        const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
          import('three'),
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/addons/environments/RoomEnvironment.js'),
        ])
        if (cancelled || !host) return

        const canvas = document.createElement('canvas')
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

        const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.05
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.domElement.setAttribute('aria-hidden', 'true')
        renderer.domElement.className = 'persona-scene__canvas'
        Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' })
        host.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-3, 3, 2.7, -2.7, 0.1, 60)
        camera.position.set(0, 1.5, 10)
        camera.lookAt(0, 1.45, 0)

        const studio = new RoomEnvironment()
        const pmrem = new THREE.PMREMGenerator(renderer)
        const environment = pmrem.fromScene(studio, 0.04)
        scene.environment = environment.texture
        scene.environmentIntensity = 0.55
        studio.dispose()
        pmrem.dispose()

        scene.add(new THREE.HemisphereLight(0xfffaf0, 0x232650, 1.85))
        const key = new THREE.DirectionalLight(0xfff3df, 3.2)
        key.position.set(-3.5, 7, 5)
        key.castShadow = true
        key.shadow.mapSize.set(1024, 1024)
        key.shadow.normalBias = 0.025
        scene.add(key)
        const rim = new THREE.DirectionalLight(0xb8c8ff, 2.2)
        rim.position.set(4, 4, -3)
        scene.add(rim)

        const loader = new GLTFLoader()
        const gltf = await loader.loadAsync('/models/signalpass-personas.glb')
        const loadWithTimeout = <T,>(promise: Promise<T>, timeoutMs: number) =>
          Promise.race([
            promise,
            new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
          ])
        let leftGltf: Awaited<ReturnType<typeof loader.loadAsync>> | null = null
        let rightGltf: Awaited<ReturnType<typeof loader.loadAsync>> | null = null
        try {
          leftGltf = await loadWithTimeout(loader.loadAsync('/models/hunyuan-left-character.glb'), 8000)
        } catch {
          // The base Blender scene remains usable if a high-detail asset fails.
        }
        try {
          rightGltf = await loadWithTimeout(loader.loadAsync('/models/hunyuan-right-character.glb'), 8000)
        } catch {
          // Load the second persona independently to avoid taking down the scene.
        }
        if (cancelled || !host) return
        const model = gltf.scene
        model.position.set(0, 0.42, 0)
        model.scale.setScalar(0.92)
        // Keep the Blender silhouettes visible while the high-detail Hunyuan
        // meshes are loading; they prevent an empty hero on slow connections.
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return
          object.castShadow = true
          object.receiveShadow = true
        })
        scene.add(model)

        // Hunyuan's generated single-mesh Builder Persona replaces the
        // procedural Avery while the Blender-authored right persona and card
        // remain in the base scene. Its GLB is already Y-up and arrives as a
        // compact 1.5M-triangle asset, so scale it into the same stage.
        const leftModel = leftGltf?.scene ?? null
        if (leftModel) {
          leftModel.position.set(-1.65, 0, 0.12)
          leftModel.scale.setScalar(2.5)
          leftModel.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            object.castShadow = true
            object.receiveShadow = true
          })
          scene.add(leftModel)
        }

        const rightModel = rightGltf?.scene ?? null
        if (rightModel) {
          rightModel.position.set(1.65, 0, 0.12)
          rightModel.scale.setScalar(2.5)
          rightModel.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            object.castShadow = true
            object.receiveShadow = true
          })
          scene.add(rightModel)
        }

        const mixer = new THREE.AnimationMixer(model)
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play())

        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        let visible = true
        let frame = 0
        let lastTime = 0
        let pointerX = 0
        let pointerY = 0
        let currentX = 0
        let currentY = 0
        let currentPhase = phaseRef.current
        let disposed = false
        let renderedWidth = 0
        let renderedHeight = 0
        let compactLayout = false

        function requestFrame() {
          if (!frame && !disposed && visible && !document.hidden) frame = window.requestAnimationFrame(render)
        }
        function render(time: number) {
          frame = 0
          if (disposed || !visible || document.hidden) return
          if (time - lastTime < 32) {
            requestFrame()
            return
          }
          const elapsed = lastTime ? Math.min(time - lastTime, 64) : 32
          lastTime = time
          const damping = motion.matches ? 1 : 1 - Math.exp(-elapsed / 130)
          currentX += (pointerX - currentX) * damping
          currentY += (pointerY - currentY) * damping
          currentPhase += (phaseRef.current - currentPhase) * damping
          const idleLook = Math.sin(time / 1900) * 0.018
          const leftLook = 0.11 + idleLook + currentX * 0.055
          const rightLook = -0.11 + idleLook + currentX * 0.055
          const avatarScale = compactLayout ? 1.7 : 2.5
          if (leftModel) {
            leftModel.scale.setScalar(avatarScale)
            leftModel.position.x = compactLayout ? -0.92 : -1.65
          }
          if (rightModel) {
            rightModel.scale.setScalar(avatarScale)
            rightModel.position.x = compactLayout ? 0.92 : 1.65
          }
          model.rotation.y = currentX * 0.075
          model.rotation.x = currentY * 0.026
          if (leftModel) {
            leftModel.rotation.y = leftLook
            leftModel.rotation.z = currentY * 0.012
          }
          if (rightModel) {
            rightModel.rotation.y = rightLook
            rightModel.rotation.z = currentY * 0.012
          }
          const breathe = Math.sin(time / 1500) * 0.012
          model.position.y = 0.42 + breathe
          if (leftModel) leftModel.position.y = (compactLayout ? 0.28 : 0) + breathe
          if (rightModel) rightModel.position.y = (compactLayout ? 0.28 : 0) + breathe
          const card = model.getObjectByName('Introduction_Card_3D')
          if (card) {
            card.position.z = 0.52 + Math.sin(time / 900) * 0.018
            card.rotation.y = currentPhase * 0.025
          }
          // The GLB actions are intentionally advanced only after the first
          // frame has rendered; this keeps a slow device from blocking paint.
          mixer.update(elapsed / 1000)
          renderer.render(scene, camera)
          requestFrame()
        }
        function resize() {
          const width = host!.clientWidth
          const height = host!.clientHeight
          if (!width || !height || disposed || (width === renderedWidth && height === renderedHeight)) return
          renderedWidth = width
          renderedHeight = height
          renderer.setSize(width, height, false)
          const aspect = width / height
          compactLayout = width <= 700
          const viewHeight = compactLayout ? 6.5 : Math.max(4.35, 5.4 / aspect)
          camera.left = (-viewHeight * aspect) / 2
          camera.right = (viewHeight * aspect) / 2
          camera.top = viewHeight / 2
          camera.bottom = -viewHeight / 2
          camera.updateProjectionMatrix()
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
          model.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            object.geometry.dispose()
            if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose())
            else object.material.dispose()
          })
          leftModel?.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            object.geometry.dispose()
            if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose())
            else object.material.dispose()
          })
          rightModel?.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            object.geometry.dispose()
            if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose())
            else object.material.dispose()
          })
          mixer.stopAllAction()
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
    <div ref={hostRef} className="persona-scene" data-scene-state={state} role="img" aria-label="Blender-authored 3D Builder Personas and a physical Introduction Card. Their eyes and hair animate gently while a private agent handshake prepares context." style={{ position: 'relative', width: '100%', height: '100%' }}>
      {state !== 'ready' && (
        <div className="persona-scene__fallback" aria-hidden="true">
          <div className="persona-scene__fallback-person persona-scene__fallback-person--left" />
          <div className="persona-scene__fallback-person persona-scene__fallback-person--right" />
        </div>
      )}
    </div>
  )
}
