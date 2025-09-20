import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button";
import DetectionService from "../../services/detection.service";
import { Loader } from "lucide-react";

const DetectionImages = () => {
  const [response, setResponse] = useState();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newDetect, setNewDetect] = useState(true);
  // Fungsi untuk mengakses kamera
  const startCamera = async () => {
    // Stop any existing camera stream first
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        width: { ideal: 640 }, // lebih ringan dari default
        height: { ideal: 480 },
      });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  useEffect(() => {
    getLocation();
    startCamera(); // Panggil fungsi saat komponen dimuat atau `facingMode` berubah
  }, [facingMode]);

  // Fungsi untuk memutar kamera
  const flipCamera = () => {
    setFacingMode((currentMode) =>
      currentMode === "user" ? "environment" : "user"
    );
  };

  const takePicture = async () => {
    // Logic untuk mengambil gambar (sama seperti sebelumnya)
    setNewDetect(true);
    setIsLoading(true);
    const locationData = await getLocation();

    setLocation(locationData);

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setImage(imageDataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setImageBlob(blob);
        }
      },
      "image/jpeg",
      0.7
    );
    setIsLoading(false);
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation is not supported."));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (err) => {
          reject(err);
        }
      );
    });
  };

  const submitDetection = async () => {
    setIsLoading(true);
    try {
      const res = await DetectionService.detectionImage(imageBlob, location);
      setResponse(res);
      console.log(res);
      setIsLoading(false);
      setNewDetect(false);
    } catch (error) {
      console.log(error);

      setIsLoading(false);
    }
  };

  return (
    <div className="justify-center flex py-10">
      <div>
        <video ref={videoRef} autoPlay playsInline muted />
        <div className="grid grid-cols-3 gap-x-4 mt-8">
          <Button className="col" onClick={takePicture} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <Loader className="mr-2 animate-spin" /> Ambil Gambar
              </span>
            ) : (
              "Ambil Gambar"
            )}
          </Button>
          <Button className="col" onClick={flipCamera}>
            Putar Kamera
          </Button>
          <Button
            className="col bg-emerald-600 text-white"
            onClick={submitDetection}
            variant={"ghost"}
            disabled={!image || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader className="mr-2 animate-spin" /> Deteksi
              </span>
            ) : (
              "Deteksi"
            )}
          </Button>
        </div>
        {newDetect ? (
          image && <img src={image} alt="Taken" className="mt-8" />
        ) : (
          <img
            src={response.url}
            alt="Detection image result"
            className="mt-8"
          />
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};

export default DetectionImages;
