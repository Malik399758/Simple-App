from flask import Flask, render_template, jsonify
import subprocess
import platform
import re
import random
from datetime import datetime

app = Flask(__name__)

# Demo data is fictional and clearly labeled as simulated.
DEMO_NETWORKS = [
    {"ssid": "Campus_WiFi", "bssid": "02:11:22:33:44:01", "signal": 92, "channel": 6,
     "security": "WPA2-Personal", "radio": "802.11n"},
    {"ssid": "Lab_Router_5G", "bssid": "02:11:22:33:44:02", "signal": 78, "channel": 36,
     "security": "WPA2-Personal", "radio": "802.11ac"},
    {"ssid": "Guest_Network", "bssid": "02:11:22:33:44:03", "signal": 56, "channel": 11,
     "security": "WPA2-Personal", "radio": "802.11n"},
    {"ssid": "IoT_Demo", "bssid": "02:11:22:33:44:04", "signal": 41, "channel": 1,
     "security": "WPA3-Personal", "radio": "802.11ax"},
    {"ssid": "Hidden network", "bssid": "02:11:22:33:44:05", "signal": 29, "channel": 44,
     "security": "Unknown", "radio": "802.11ac"},
]

def parse_windows_wifi(output):
    networks = []
    current = None
    current_bssid = None
    for raw in output.splitlines():
        line = raw.strip()
        if line.startswith("SSID ") and ":" in line:
            # Example: SSID 1 : NetworkName
            if current and current_bssid:
                networks.append(current)
            name = line.split(":", 1)[1].strip() or "(Hidden SSID)"
            current = {"ssid": name, "bssid": "", "signal": None, "channel": None,
                       "security": "Unknown", "radio": "Unknown"}
            current_bssid = False
        elif current is not None and line.startswith("BSSID ") and ":" in line:
            if current_bssid:
                networks.append(current)
                current = dict(current)
            current["bssid"] = line.split(":", 1)[1].strip()
            current["signal"] = None
            current["channel"] = None
            current_bssid = True
        elif current is not None and ":" in line:
            key, value = [part.strip() for part in line.split(":", 1)]
            lower = key.lower()
            if lower == "signal":
                match = re.search(r"(\d+)", value)
                if match:
                    current["signal"] = int(match.group(1))
            elif lower == "channel":
                match = re.search(r"(\d+)", value)
                if match:
                    current["channel"] = int(match.group(1))
            elif lower in ("authentication", "authentication"):
                current["security"] = value
            elif lower == "encryption":
                current["security"] = (current.get("security", "Unknown") + " / " + value).strip(" /")
            elif lower == "radio type":
                current["radio"] = value
    if current and current_bssid:
        networks.append(current)
    # Remove duplicate blank entries and normalize values.
    clean = []
    seen = set()
    for n in networks:
        key = (n.get("ssid"), n.get("bssid"))
        if key in seen:
            continue
        seen.add(key)
        n["signal"] = n["signal"] if n["signal"] is not None else 0
        n["channel"] = n["channel"] if n["channel"] is not None else "—"
        n["security"] = n["security"] or "Unknown"
        n["radio"] = n["radio"] or "Unknown"
        clean.append(n)
    return clean

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/scan/<mode>")
def scan(mode):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if mode == "demo":
        # Small signal variation makes repeated demos feel realistic; all data is fictional.
        rows = []
        for item in DEMO_NETWORKS:
            row = dict(item)
            row["signal"] = max(1, min(100, row["signal"] + random.randint(-4, 4)))
            rows.append(row)
        return jsonify({"ok": True, "mode": "demo", "timestamp": timestamp,
                        "message": "Simulated sample data — not a live scan.", "networks": rows})
    if mode != "live":
        return jsonify({"ok": False, "error": "Unknown scan mode."}), 400
    if platform.system() != "Windows":
        return jsonify({"ok": False, "error": "Live scan is configured for Windows only. Use Demo Mode on this operating system."}), 400
    try:
        result = subprocess.run(
            ["netsh", "wlan", "show", "networks", "mode=bssid"],
            capture_output=True, text=True, timeout=15, check=False,
            encoding="utf-8", errors="replace"
        )
        if result.returncode != 0:
            return jsonify({"ok": False, "error": (result.stderr or result.stdout or "netsh command failed.").strip()}), 500
        networks = parse_windows_wifi(result.stdout)
        return jsonify({"ok": True, "mode": "live", "timestamp": timestamp,
                        "message": "Live read-only scan from this Windows computer.", "networks": networks})
    except FileNotFoundError:
        return jsonify({"ok": False, "error": "netsh was not found. Run this app on Windows."}), 500
    except subprocess.TimeoutExpired:
        return jsonify({"ok": False, "error": "Scan timed out. Check that Wi-Fi is enabled, then try again."}), 504
    except Exception as exc:
        return jsonify({"ok": False, "error": f"Scan failed: {exc}"}), 500

if __name__ == "__main__":
    # Local-only server: not exposed to the LAN by default.
    app.run(host="127.0.0.1", port=5000, debug=False)
