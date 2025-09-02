import React, { useRef, useState, useEffect } from "react";

const CameraControl = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // 'user' (depan) atau 'environment' (belakang)

  // Fungsi untuk memulai stream dari kamera dengan facingMode yang ditentukan
  const startStream = async (mode) => {
    // Hentikan stream yang ada sebelum memulai yang baru
    stopStream();

    try {
      const constraints = {
        video: { facingMode: mode },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
      setRecordedVideoUrl(null);
      setFacingMode(mode); // Set status facingMode
    } catch (err) {
      console.error("Gagal mendapatkan akses kamera:", err);
      setIsCameraOn(false);
      alert(
        "Kamera tidak tersedia atau akses ditolak. Pastikan Anda menggunakan HTTPS."
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
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  // Fungsi untuk menghentikan perekaman
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // Mengubah kamera
  const toggleFacingMode = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    startStream(newMode);
  };

  // Cleanup saat komponen dilepas
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

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

      {recordedVideoUrl && (
        <div style={{ marginTop: "20px" }}>
          <h3>Video yang Direkam:</h3>
          <video
            src={recordedVideoUrl}
            controls
            style={{ width: "100%", maxWidth: "600px" }}
          />
          <a
            href={recordedVideoUrl}
            download="rekaman_video.webm"
            style={{ display: "block", marginTop: "10px" }}
          >
            Unduh Video
          </a>
        </div>
      )}
    </div>
  );
};

export default CameraControl;
