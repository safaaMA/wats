const video = document.getElementById("video");
const recognizedNames = new Set(); // مجموعة لتخزين أسماء الأشخاص المعترف بهم

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

function getLabeledFaceDescriptions() {
  const labels = ["Felipe", "Messi", "صفاء", "حسوني"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 1; i++) {
        const img = await faceapi.fetchImage(`./labels/${label}/${i}.png`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

video.addEventListener("play", async () => {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const name = result.label; // احصل على اسم الشخص المعترف به بدون النسبة
      if (!recognizedNames.has(name)) {
        recognizedNames.add(name); // إضافة الاسم إلى المجموعة إذا لم يتم التعرف عليه من قبل
        // طباعة اسم الشخص هنا (قم بتنفيذ الإجراء المطلوب)
        console.log("تم التعرف على شخص بالاسم:", name);
        // يمكنك هنا إرسال اسم الشخص أو أي إجراء آخر ترغب في تنفيذه عند التعرف على شخص جديد
      }
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: name, // استخدم الاسم كنص لرسم الإطار
      });
      drawBox.draw(canvas);
    });
  }, 100);
});
