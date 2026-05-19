from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QTimer
from PySide6.QtWidgets import (
    QFileDialog,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QSpinBox,
    QVBoxLayout,
    QWidget,
)

from app.services.monitor import MonitorService
from app.services.vk_api import VKClient
from app.storage.db import Database
from app.utils.export import export_csv, export_json
from app.utils.urls import normalize_vk_ref


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("VK Monitor")
        self.resize(1200, 700)
        self.db = Database(Path("vk_monitor.db"))
        self.community_id: int | None = None
        self.monitor: MonitorService | None = None

        root = QWidget()
        self.setCentralWidget(root)
        lay = QVBoxLayout(root)

        top = QHBoxLayout()
        self.url = QLineEdit()
        self.url.setPlaceholderText("https://vk.com/your_group")
        self.add_btn = QPushButton("Добавить сообщество")
        self.check_btn = QPushButton("Проверить сейчас")
        self.export_json_btn = QPushButton("Экспорт JSON")
        self.export_csv_btn = QPushButton("Экспорт CSV")
        top.addWidget(self.url)
        top.addWidget(self.add_btn)
        top.addWidget(self.check_btn)
        top.addWidget(self.export_json_btn)
        top.addWidget(self.export_csv_btn)
        lay.addLayout(top)

        settings = QHBoxLayout()
        self.token = QLineEdit(self.db.get_config("token"))
        self.token.setPlaceholderText("VK token")
        self.interval = QSpinBox()
        self.interval.setRange(1, 1440)
        self.interval.setValue(int(self.db.get_config("interval", "10")))
        self.status = QLabel("Готово")
        settings.addWidget(QLabel("Токен:"))
        settings.addWidget(self.token)
        settings.addWidget(QLabel("Интервал (мин):"))
        settings.addWidget(self.interval)
        settings.addWidget(self.status)
        lay.addLayout(settings)

        content = QHBoxLayout()
        self.sections = QListWidget()
        for s in ["all", "wall_posts", "videos", "photos", "clips", "market", "discussions", "settings"]:
            self.sections.addItem(s)
        self.changes = QListWidget()
        content.addWidget(self.sections, 1)
        content.addWidget(self.changes, 3)
        lay.addLayout(content)

        self.setStyleSheet("QMainWindow{background:#171717;color:#ffd400;} QPushButton{background:#ffd400;color:#111;font-weight:700;padding:6px;} QLineEdit,QListWidget,QSpinBox{background:#232323;color:#ffd400;border:1px solid #ffd400;} QLabel{color:#ffd400;}")

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.check_now)

        self.add_btn.clicked.connect(self.add_community)
        self.check_btn.clicked.connect(self.check_now)
        self.sections.currentTextChanged.connect(self.refresh_changes)
        self.export_json_btn.clicked.connect(self.export_json)
        self.export_csv_btn.clicked.connect(self.export_csv)
        self.interval.valueChanged.connect(self.update_interval)

        self.update_interval()

    def client(self):
        token = self.token.text().strip()
        if not token:
            raise ValueError("Введите VK токен")
        self.db.set_config("token", token)
        return VKClient(token)

    def add_community(self):
        try:
            ref = normalize_vk_ref(self.url.text())
            vk = self.client()
            g = vk.resolve_community(ref)
            self.community_id = int(g["id"])
            self.db.upsert_community(self.community_id, g.get("screen_name", ""), g.get("name", ""))
            self.monitor = MonitorService(self.db, vk)
            if self.db.get_latest_snapshot(self.community_id) is None:
                self.monitor.initial_snapshot(self.community_id)
                self.status.setText("Первый снимок сохранен")
            else:
                self.status.setText("Сообщество подключено")
            self.refresh_changes()
        except Exception as e:
            QMessageBox.critical(self, "Ошибка", str(e))

    def check_now(self):
        if not self.monitor or not self.community_id:
            return
        try:
            changes = self.monitor.check(self.community_id)
            self.status.setText(f"Проверка завершена. Новых: {len(changes)}")
            self.refresh_changes()
        except Exception as e:
            self.status.setText(f"Ошибка проверки: {e}")

    def refresh_changes(self):
        self.changes.clear()
        rows = self.db.list_changes(self.community_id, self.sections.currentItem().text() if self.sections.currentItem() else "all")
        for r in rows:
            text = f"[{r['detected_at']}] {r['section']} | {r['change_type']}\n{r['title']}\n{r['url']}"
            self.changes.addItem(QListWidgetItem(text))

    def update_interval(self):
        self.db.set_config("interval", str(self.interval.value()))
        self.timer.start(self.interval.value() * 60 * 1000)

    def export_json(self):
        if not self.community_id:
            return
        path, _ = QFileDialog.getSaveFileName(self, "Экспорт JSON", "report.json", "JSON (*.json)")
        if path:
            export_json(self.db.list_changes(self.community_id), Path(path))

    def export_csv(self):
        if not self.community_id:
            return
        path, _ = QFileDialog.getSaveFileName(self, "Экспорт CSV", "report.csv", "CSV (*.csv)")
        if path:
            export_csv(self.db.list_changes(self.community_id), Path(path))
