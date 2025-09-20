import { Route, Routes } from "react-router-dom";
import CameraSelector from "./Camera";
import CameraControlWithLocation from "./CameraWithLocation";
import DetectionImages from "./pages/detection-images/detection-images.jsx";
import MenuHome from "./components/menus/MenuHome.jsx";

function App() {
  return (
    <div>
      {/* <CameraSelector /> */}
      {/* <CameraControlWithLocation /> */}
      <Routes>
        <Route index element={<MenuHome />} />
        <Route path="/detection-images" element={<DetectionImages />} />
      </Routes>
    </div>
  );
}

export default App;
