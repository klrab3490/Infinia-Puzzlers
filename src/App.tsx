import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";


function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            {/* <AuthProvider> */}
                <Router>
                    <Routes>

                        <Route path="/" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                    </Routes>
                </Router>
            {/* </AuthProvider> */}
        </ThemeProvider>
    )
}

export default App;
