import sys
import whisper
import os

model = whisper.load_model("base")

print("READY", flush=True)  # Signal ready to Node.js

def transcribe_file(file_path):
    if not os.path.exists(file_path):
        print(f"ERROR: File does not exist: {file_path}", flush=True)
        return

    try:
        result = model.transcribe(file_path, task='transcribe')
        print(result["text"].strip(), flush=True)
    except Exception as e:
        print(f"ERROR: {str(e)}", flush=True)

while True:
    line = sys.stdin.readline()
    if not line:
        break
    file_path = line.strip()
    transcribe_file(file_path)

