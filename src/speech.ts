



	var recognition = new webkitSpeechRecognition();
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.onresult = function(event: any) { 
  		var interim_transcript = '';
		var final_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
console.log(">>"+interim_transcript);
console.log("!!!"+final_transcript);

	}
	recognition.start();
    