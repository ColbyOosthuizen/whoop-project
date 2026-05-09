"""
Jarvis — Tennis desktop app.
Entry point. Launches the PyWebView window with the API bridge.
"""

import webview
from pathlib import Path
from api import JarvisAPI

UI_DIR = Path(__file__).parent / "ui"


def main():
    api = JarvisAPI()
    window = webview.create_window(
        title="Jarvis — Tennis",
        url=str(UI_DIR / "index.html"),
        js_api=api,
        width=1280,
        height=820,
        min_size=(1024, 700),
        background_color="#0d1117",
        text_select=True,
    )
    webview.start(debug=False)


if __name__ == "__main__":
    main()
