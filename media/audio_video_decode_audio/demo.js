window.addEventListener("load", main);

function main() {
	let audioElements = document.querySelectorAll("audio");
	let videoElements = document.querySelectorAll("video");

	let mediaElements = [audioElements, videoElements]
		.map((els) => Array.from(els))
		.flat();

	mediaElements.forEach((el) => {
		let textarea = document.createElement("textarea");
		el.parentNode.insertBefore(textarea, el.nextElementSibling);

		decodeAudioAndShowOutput(el, textarea);
	});
}

async function decodeAudioAndShowOutput(mediaSrcEl, textArea) {
	let srcURL = mediaSrcEl.src;

	let response = await fetch(srcURL);
	let arrayBuffer = await response.arrayBuffer();
	let audioContext = new OfflineAudioContext(2, 1, 44100);
	let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

	let lines = [];
	lines.push(`Channel count: ${audioBuffer.numberOfChannels}`);
	for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
		let channelData = audioBuffer.getChannelData(i);
		lines.push(`Channel ${i} (${channelData.length} samples)`);
		lines.push(channelData.join(","));
	}

	textArea.innerHTML = lines.join("\n");
}
