import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "../../components/ui/button";
import DetectionService from "../../services/detection.service";
import { Loader } from "lucide-react";

const videoConstraints = {
  facingMode: "user",
};

const DetectionImages = () => {
  const [response, setResponse] = useState();
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newDetect, setNewDetect] = useState(true);
  const [facingMode, setFacingMode] = useState("user");
  const [imageBlob, setImageBlob] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

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

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const takePicture = useCallback(async () => {
    setNewDetect(true);
    setIsLoading(true);
    const locationData = await getLocation();
    setLocation(locationData);

    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);

    // Convert Base64 string to Blob object
    const blob = dataURLtoBlob(imageSrc);
    setImageBlob(blob);

    setIsLoading(false);
  }, [webcamRef]);

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
      alert(error);
      setIsLoading(false);
    }
  };
  const flipCamera = () => {
    setFacingMode((currentMode) =>
      currentMode === "user" ? "environment" : "user"
    );
  };

  return (
    <div className="justify-center flex py-10">
      <div>
        <Webcam
          audio={false}
          ref={webcamRef}
          mirrored={facingMode === "user"}
          videoConstraints={{ ...videoConstraints, facingMode: facingMode }}
        />
        <div className="grid grid-cols-3 gap-x-4 mt-8">
          <Button onClick={takePicture} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <Loader className="mr-2 animate-spin" /> Ambil Gambar      
              </span>
            ) : (
              "Ambil Gambar"
            )}
          </Button>
          <Button onClick={flipCamera}>Putar Kamera</Button>
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
      </div>
    </div>
  );
};

export default DetectionImages;
