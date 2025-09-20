import { Link } from "react-router-dom";
import { Button } from "../ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Menu = () => {
  return (
    <div className="h-screen">
      <div className="flex items-center space-x-4 justify-center h-full">
        <Link to={"/detection-images"}>
          <Button>Deteksi Gambar</Button>
        </Link>
        <Button>Deteksi Video</Button>
      </div>
    </div>
  );
};

export default Menu;
