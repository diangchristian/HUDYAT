import { Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";

function App() {
  return (
    <Routes>
        <Route index element={<HomePage/>} />
        <Route path="/login" element={<LoginPage/>} />
    </Routes>
  )
}

export default App
