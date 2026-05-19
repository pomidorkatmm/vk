@echo off
setlocal
python -m pip install -r requirements.txt
python -m pip install pyinstaller
pyinstaller --noconfirm --name VKMonitor --windowed --onefile app/main.py
endlocal
