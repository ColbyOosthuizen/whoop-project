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
        width=1320,
        height=860,
        min_size=(1100, 700),
        background_color="#070d14",
        text_select=True,
    )

    def on_started():
        api.set_window(window)
        api.start_auto_sync()

    webview.start(on_started, debug=False)


if __name__ == "__main__":
    main()
