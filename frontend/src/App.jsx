import { BrowserRouter, Routes, Route } from "react-router-dom";

import UserSelection from "./pages/UserSelection";
import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendations";
import History from "./pages/History";
import ProductDetails from "./pages/ProductDetails";

function Placeholder({ title }) {
    return (
        <div className="placeholder-page">
            <h1>{title}</h1>
            <p>Esta página será implementada no próximo passo.</p>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<UserSelection />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route
                    path="/recommendations"
                    element={<Recommendations />}
                />

                <Route path="/history" element={<History />} />

                <Route
                    path="/products/:parentAsin"
                    element={<ProductDetails />}
                />

                <Route
                    path="/results"
                    element={<Placeholder title="Resultados" />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;