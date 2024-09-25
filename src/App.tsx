import { ThemeProvider } from "@/components/theme-provider"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex justify-center items-center min-h-screen">
        
      </div>
    </ThemeProvider>
  )
}

export default App
