"""Word-level timestamps for a voiceover (faster-whisper).
Usage: python3 tools/transcribe.py public/enigma/vo.wav > src/shorts/enigma/words.json
"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

model = WhisperModel('small.en', device='cpu', compute_type='int8')
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
segments, _ = model.transcribe(audio, word_timestamps=True, beam_size=5)
words = [{'w': w.word.strip(), 's': round(w.start, 2), 'e': round(w.end, 2)} for seg in segments for w in seg.words]
json.dump(words, sys.stdout, indent=0)
