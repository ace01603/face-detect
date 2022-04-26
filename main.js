window.onload = _ => {

    const webcamDisplay = document.querySelector("#webcam");
    const webcamToggle = document.querySelector("#toggle input");
    const probToggle = document.querySelector("#probability");
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const message = document.querySelector("#message");
    const probDisplay = document.querySelector("#prob-val");
    const webcamError = "This page requires access to your webcam, assuming you have one. Try refreshing the page and, when prompted for access to the webcam, choose 'Allow'.";
    const instructions = "Use the toggle switch to turn on your webcam and start detecting faces.";
    let model, timer;
    let prob = 80;

    webcamToggle.addEventListener("change", () => {
        if (webcamToggle.checked) {
            toggleDisplay(webcamDisplay, message);
            start();
        } else {
            pause();
            toggleDisplay(message, webcamDisplay);
        }
    });

    probability.addEventListener("change", () => {
        prob = probToggle.value;
        probDisplay.innerHTML = prob + "%";
    })

    window.addEventListener("resize", () => {
        canvas.width = webcamDisplay.clientWidth;
        canvas.height = webcamDisplay.clientHeight;   
    });

    const toggleDisplay = (toShow, toHide) => {
        toShow.classList.remove("hide");
        toShow.classList.add("show");
        toHide.classList.remove("show");
        toHide.classList.add("hide");
    }

    const pause = () => {
        const webcam = webcamDisplay.srcObject;
        if (webcam) {
            const tracks = webcam.getTracks();
            for (let track of tracks) {
                track.stop();
            }
            webcamDisplay.removeEventListener("loadeddata", startPredictions);
            stopPredictions();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        message.innerHTML = instructions;
    }

    const start = () => {
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({video:true})
                .then(stream => { 
                    webcamDisplay.srcObject = stream;
                    webcamDisplay.addEventListener("loadeddata", startPredictions);
                })
                .catch(err => { 
                    console.log("Oops:", err);
                    message.innerHTML = webcamError;
                    toggleDisplay(message, webcamDisplay);
                    webcamToggle.checked = false;
                });
        }
    }

    const startPredictions = () => {
        canvas.width = webcamDisplay.clientWidth;
        canvas.height = webcamDisplay.clientHeight;  
        timer = setInterval(() => predict(), 300);
    }

    const stopPredictions = () => clearInterval(timer);

    const predict = async () => {
        const predictions = await model.estimateFaces(webcamDisplay, false);
        const origWidth = webcamDisplay.videoWidth;
        const origHeight = webcamDisplay.videoHeight;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let pred of predictions) {
            if (pred.probability[0] >= prob / 100) {
                ctx.fillStyle = "#49c8e7";
                const left = scale(pred.topLeft[0], origWidth, canvasWidth);
                const top = scale(pred.topLeft[1], origHeight, canvasHeight);
                const width = scale(pred.bottomRight[0] - pred.topLeft[0], origWidth, canvasWidth);
                const height = scale(pred.bottomRight[1] - pred.topLeft[1], origHeight, canvasHeight)
                ctx.fillRect(canvasWidth - left - width, top, width, height);
            }
        }
    };

    const scale = (raw, orig, dest) => raw / orig * dest

    const app = async () => {
        message.innerHTML = "Loading model. Please wait...";
        model = await blazeface.load();
        message.innerHTML = instructions;
        probDisplay.innerHTML = prob + "%";
    }
    
    app();
}