window.addEventListener("load", function () {
	let ac = null;
	let streamDestinationNode = null;
	let mediaRecorder = null;
	let audioChunks = [];
	let currentVoices = [];
	let buttonsSpan = document.getElementById("buttons");
	let numRepeats = 15;

	for (var i = 0; i < numRepeats; i++) {
		let btn = document.createElement("button");
		btn.innerHTML = i + 1;
		btn.addEventListener("click", triggerOscillatorsStart);
		buttonsSpan.appendChild(btn);
	}

	function triggerOscillatorsStart() {
		var numOscillators = this.innerHTML * 1.0;
		launchOscillators(numOscillators);
	}

	function launchOscillators(
		num = 1,
		delayBetween = 0.25,
		baseFreq = 100,
		freqInterval = 50
	) {
		let audioContext = getAudioContext();
		let now = audioContext.currentTime;

		console.log(streamDestinationNode);

		currentVoices.forEach((v) => {
			v.osc.stop(now);
		});

		currentVoices = [];

		for (let i = 0; i < num; i++) {
			let voice = setupVoice(
				audioContext,
				streamDestinationNode,
				baseFreq + freqInterval * i,
				now + i * delayBetween,
				1,
				0.5
			);
			currentVoices.push(voice);
		}

		startRecording();

		let lastVoice = currentVoices[currentVoices.length - 1];
		if (lastVoice) {
			lastVoice.osc.addEventListener("ended", () => {
				console.log("the last one finished");
				stopRecording();
			});
		}
	}

	function setupVoice(
		audioContext,
		streamNode,
		freq,
		startTime,
		sustainTime,
		decayTime
	) {
		let fadeOutEnd = startTime + 0.5;
		let decayStart = fadeOutEnd + sustainTime;
		let decayEnd = decayStart + decayTime;
		let stopTime = decayEnd + 0.1;

		let gainNode = new GainNode(audioContext);
		let oscNode = new OscillatorNode(audioContext);

		gainNode.gain.value = 0;
		gainNode.gain.linearRampToValueAtTime(1, fadeOutEnd);
		gainNode.gain.setValueAtTime(1.0, decayStart);
		gainNode.gain.linearRampToValueAtTime(0, decayEnd);

		oscNode.frequency.setValueAtTime(freq, startTime);

		oscNode.connect(gainNode);
		gainNode.connect(audioContext.destination);
		gainNode.connect(streamNode);

		oscNode.start(startTime);
		oscNode.stop(stopTime);
		oscNode.addEventListener("ended", (e) => {
			console.log("disconnected", stopTime);
			gainNode.disconnect();
		});

		return {
			osc: oscNode,
			gain: gainNode,
		};
	}

	function getAudioContext() {
		if (ac === null) {
			ac = new AudioContext();
			streamDestinationNode = new MediaStreamAudioDestinationNode(ac);
		}
		return ac;
	}

	function startRecording() {
		console.log("start re");
		mediaRecorder = new MediaRecorder(streamDestinationNode.stream);
		audioChunks = [];

		mediaRecorder.addEventListener("dataavailable", (e) => {
			audioChunks.push(e.data);
		});

		mediaRecorder.addEventListener("stop", (e) => {
			let containerType = "ogg";

			// because, of course
			if (navigator.userAgent.indexOf("Safari") !== -1) {
				containerType = "mp4";
			}
			let blobType = `audio/${containerType}`;

			let audioBlob = new Blob(audioChunks, { type: blobType });
			addRecording(audioBlob, containerType);
		});

		mediaRecorder.start();
		console.log(mediaRecorder);
	}

	function stopRecording() {
		if (mediaRecorder) {
			mediaRecorder.stop();
			mediaRecorder = null;
		}
	}

	function addRecording(audioData, containerType) {
		let recordingsEl = document.getElementById("recordings");
		let existingAudios = recordingsEl.querySelectorAll("audio");
		if (existingAudios.length === 0) {
			recordingsEl.innerHTML = "";
		}

		let audioEl = document.createElement("audio");
		audioEl.controls = true;
		audioEl.src = URL.createObjectURL(audioData);

		let downloadLink = document.createElement("a");
		let timestamp = new Date().toLocaleString().replaceAll(/[^\d]/g, "-");
		let uaName = navigator.userAgent.replaceAll(/[^\w\d\-]+?/g, "_");
		let filename = `audio-${uaName}-${timestamp}.${containerType}`;
		downloadLink.setAttribute("download", filename);
		downloadLink.setAttribute("href", audioEl.src);
		downloadLink.innerHTML = filename;

		let div = document.createElement("div");
		div.appendChild(audioEl);
		div.appendChild(downloadLink);

		recordingsEl.appendChild(div);
	}
});
