import { Route, Routes } from "react-router-dom";
import CameraSelector from "./Camera";
import CameraControlWithLocation from "./CameraWithLocation";
import Menu from "./components/menus/menu";
import DetectionImages from "./pages/detection-images/detection-images";

function App() {
  return (
    <div>
      {/* <CameraSelector /> */}
      {/* <CameraControlWithLocation /> */}
      <Routes>
        <Route index element={<Menu />} />
        <Route path="/detection-images" element={<DetectionImages />} />
      </Routes>
    </div>
  );
}

export default App;
