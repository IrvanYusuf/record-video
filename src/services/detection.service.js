const detectionImage = async (imageFile, location) => {
  // 1. Create a FormData object
  const formData = new FormData();
  console.log(location);

  formData.append("image", imageFile);
  formData.append("latitude", location.latitude);
  formData.append("longitude", location.longitude);

  // 3. Send the FormData object in the request body
  const response = await fetch("http://127.0.0.1:8000/detection/image", {
    method: "POST",
    body: formData,
  });

  console.log(response);

  const json = await response.json();
  console.log(json);

  return json;
};

const DetectionService = {
  detectionImage,
};

export default DetectionService;
