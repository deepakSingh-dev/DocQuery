"""File watcher.

Watches the uploads/ folder and automatically enqueues a Celery ingestion task
whenever a new document appears, ignoring temporary and hidden files.
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from watchdog.events import FileSystemEventHandler, FileCreatedEvent
from watchdog.observers import Observer

IGNORED_SUFFIXES = {".tmp", ".part"}
UPLOADS_DIR = "uploads"


class UploadHandler(FileSystemEventHandler):
    def on_created(self, event: FileCreatedEvent) -> None:
        if event.is_directory:
            return

        path = Path(event.src_path)

        if path.name.startswith("."):
            return
        if path.suffix.lower() in IGNORED_SUFFIXES:
            return

        print(f"[Watcher] New file detected: {path.name} — queuing ingestion")

        try:
            from tasks.ingest_task import ingest_document
            ingest_document.delay(str(path.resolve()))
        except Exception as e:
            print(f"[Watcher] Failed to queue task: {e}")


def start_watcher() -> None:
    handler = UploadHandler()
    observer = Observer()
    observer.schedule(handler, path=UPLOADS_DIR, recursive=False)
    observer.daemon = True
    observer.start()
    print(f"[Watcher] Monitoring {UPLOADS_DIR}/ for new files. Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n[Watcher] Stopped.")

    observer.join()


if __name__ == "__main__":
    start_watcher()
