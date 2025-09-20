import { useRef, useState, useEffect } from "react";
// import { uploadData } from "./lib/utils";

const CameraControlWithLocation = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const watchIdRef = useRef(null); // Ref untuk ID watchPosition
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fps, setFps] = useState(0);

  // #################
  const [blob, setBlob] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [locationData, setLocationData] = useState([]); // State untuk menyimpan data lokasi
  const [permissionStatus, setPermissionStatus] = useState("idle"); // 'idle', 'granted', 'denied'
  const [recordStartTime, setRecordStartTime] = useState(null);
  // Fungsi untuk memulai stream dari kamera
  const startStream = async (mode) => {
    stopStream();
    setPermissionStatus("idle");

    try {
      const constraints = { video: { facingMode: mode }, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
      setRecordedVideoUrl(null);
      setFacingMode(mode);
      setPermissionStatus("granted");
    } catch (err) {
      console.error("Gagal mendapatkan akses kamera:", err);
      setIsCameraOn(false);
      setPermissionStatus("denied");
      alert(
        "Akses kamera ditolak atau tidak tersedia. Pastikan Anda menggunakan HTTPS."
      );
    }
  };

  // Fungsi untuk menghentikan stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setIsRecording(false);
    setRecordedVideoUrl(null);
    setLocationData([]);
    setPermissionStatus("idle");
  };

  // Fungsi untuk memulai perekaman
  const startRecording = () => {
    if (!streamRef.current) return;

    mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    const recordedChunks = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setBlob(blob);
    };

    // Mulai perekaman video
    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordStartTime(Date.now());
    // Mulai melacak lokasi
    startLocationTracking();
  };

  // Fungsi untuk menghentikan perekaman
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Hentikan pelacakan lokasi
      stopLocationTracking();
    }
  };

  // Fungsi untuk memulai pelacakan lokasi
  const startLocationTracking = () => {
    setLocationData([]);
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setLocationData((prev) => [
            ...prev,
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now(),
            },
          ]);
        },
        (error) => console.error("Gagal melacak lokasi:", error),
        { enableHighAccuracy: true }
      );
    }
  };

  // Fungsi untuk menghentikan pelacakan lokasi
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Mengubah kamera
  const toggleFacingMode = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    startStream(newMode);
  };

  const downloadLocationDataAsCsv = () => {
    if (locationData.length === 0) {
      alert("Tidak ada data lokasi yang tersedia untuk diunduh.");
      return;
    } // Menyiapkan header CSV dengan kolom terpisah

    const headers = ["latitude", "longitude", "timestamp", "recordStartTime"]; // Mengubah data menjadi baris-baris CSV
    const rows = locationData.map((loc) => [
      loc.latitude,
      loc.longitude,
      new Date(loc.timestamp).toISOString(), // Mengubah timestamp menjadi format tanggal yang mudah dibaca
      new Date(recordStartTime).toISOString(),
    ]); // Menggabungkan header dan baris data

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n"); // Membuat Blob dari konten CSV

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" }); // Membuat URL untuk Blob
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob); // Mengatur atribut unduhan
    link.setAttribute("href", url);
    link.setAttribute("download", "data_koordinat.csv"); // Menambahkan link ke DOM dan memicu klik
    document.body.appendChild(link);
    link.click(); // Menghapus link dari DOM
    document.body.removeChild(link);
  };

  // Cleanup saat komponen dilepas
  useEffect(() => {
    return () => {
      stopStream();
      stopLocationTracking();
    };
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRecording) {
      intervalId = setInterval(() => {
        const elapsedSec = (Date.now() - recordStartTime) / 1000;
        setElapsedTime(Date.now() - recordStartTime);
        // FPS kasar berdasarkan jumlah titik lokasi/frame
        if (elapsedSec > 0) {
          setFps((locationData.length / elapsedSec).toFixed(1));
        }
      }, 1000);
    } else {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
  }, [isRecording, recordStartTime, locationData.length]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      Durasi: {(elapsedTime / 1000).toFixed(0)}s | FPS: {fps}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", maxWidth: "600px", border: "1px solid black" }}
      />
      <div style={{ marginTop: "10px" }}>
        {!isCameraOn ? (
          <button onClick={() => startStream(facingMode)}>
            Hidupkan Kamera
          </button>
        ) : (
          <>
            <button onClick={stopStream}>Matikan Kamera</button>
            <button onClick={toggleFacingMode} style={{ marginLeft: "10px" }}>
              Ganti Kamera
            </button>
          </>
        )}
        {isCameraOn && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            style={{ marginLeft: "10px" }}
          >
            {isRecording ? "Hentikan Rekaman" : "Mulai Rekaman"}
          </button>
        )}
      </div>
      {/* Menampilkan status pelacakan lokasi */}
      {isRecording && locationData.length > 0 && (
        <p style={{ marginTop: "10px" }}>
          Melacak lokasi... ({locationData.length} titik terkumpul)
        </p>
      )}
      {/* Menampilkan hasil pratinjau */}
      {recordedVideoUrl && (
        <div style={{ marginTop: "20px" }}>
          <h3>Video yang Direkam:</h3>
          <video
            src={recordedVideoUrl}
            controls
            style={{ width: "100%", maxWidth: "600px" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <a
              href={recordedVideoUrl}
              download="rekaman_video.webm"
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                textDecoration: "none",
                color: "black",
              }}
            >
              Unduh Video
            </a>
            <button
              onClick={downloadLocationDataAsCsv}
              style={{ padding: "8px 12px", border: "1px solid #ccc" }}
            >
              Unduh Data Excel
            </button>
            <button
              // onClick={() => uploadData(blob, locationData, recordStartTime)}
              style={{ padding: "8px 12px", border: "1px solid #ccc" }}
            >
              Upload
            </button>
          </div>
          <br />

          <h3>Data Koordinat:</h3>
          <div
            style={{
              height: "200px",
              overflowY: "scroll",
              border: "1px solid #ccc",
              padding: "10px",
              width: "100%",
              maxWidth: "600px",
            }}
          >
            {locationData.length > 0 ? (
              locationData.map((loc, index) => (
                <div key={index}>
                  <strong>Titik {index + 1}:</strong> Lintang:{" "}
                  {loc.latitude.toFixed(6)}, Bujur: {loc.longitude.toFixed(6)}
                </div>
              ))
            ) : (
              <p>Tidak ada data koordinat yang terekam.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraControlWithLocation;
