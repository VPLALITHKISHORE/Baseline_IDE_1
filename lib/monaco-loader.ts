let monacoInstance: any = null
let monacoPromise: Promise<any> | null = null

export async function loadMonaco(): Promise<any> {
  // Return existing instance if already loaded
  if (monacoInstance) {
    return monacoInstance
  }

  // Return existing promise if currently loading
  if (monacoPromise) {
    return monacoPromise
  }

  // Start loading Monaco
  monacoPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is undefined"))
      return
    }

    // Check if Monaco is already loaded
    if ((window as any).monaco) {
      monacoInstance = (window as any).monaco
      resolve(monacoInstance)
      return
    }

    // Check if loader script already exists
    const existingScript = document.querySelector('script[src*="monaco-editor"]')
    if (existingScript) {
      // Wait for existing script to load
      const checkMonaco = setInterval(() => {
        if ((window as any).monaco) {
          clearInterval(checkMonaco)
          monacoInstance = (window as any).monaco
          resolve(monacoInstance)
        }
      }, 100)
      return
    }

    // Load Monaco loader script
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"
    script.async = true

    script.onload = () => {
      const require = (window as any).require
      if (!require) {
        reject(new Error("require is not available"))
        return
      }

      require.config({
        paths: {
          vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
        },
      })

      require(["vs/editor/editor.main"], () => {
        monacoInstance = (window as any).monaco
        if (monacoInstance) {
          resolve(monacoInstance)
        } else {
          reject(new Error("Monaco object not found"))
        }
      })
    }

    script.onerror = () => {
      reject(new Error("Failed to load Monaco script"))
    }

    document.body.appendChild(script)
  })

  return monacoPromise
}

export function getMonaco(): any {
  return monacoInstance
}
