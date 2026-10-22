# Wireless Recon Lab — Network Scanning & Reconnaissance

A small Flask dashboard for teaching wireless network discovery. It includes:
- Demo mode with fictional sample networks.
- Live read-only scanning on Windows using `netsh wlan show networks mode=bssid`.
- SSID, BSSID, signal percentage, channel, authentication/encryption, and radio type table.
- Student field guide, checklist, and copyable observation report.

## Requirements
- Windows 10/11 for live scan
- Python 3.10+ recommended
- Wi-Fi enabled for live results
- Browser (Chrome, Edge, Firefox)

## Setup on Windows
1. Extract `wireless_recon_lab.zip`.
2. Open the extracted `wireless_recon_lab` folder.
3. Open Command Prompt or VS Code terminal in this folder.
4. Create a virtual environment:

   ```bat
   py -m venv .venv
   ```

5. Activate it:

   ```bat
   .venv\Scripts\activate
   ```

6. Install Flask:

   ```bat
   python -m pip install Flask
   ```

7. Start the app:

   ```bat
   python app.py
   ```

8. Open this address in your browser:

   `http://127.0.0.1:5000`

## Use the dashboard
- Choose **Demo mode** and click **Start scan** to see fictional data.
- Choose **Live Windows scan** and click **Start scan** to read nearby visible wireless network metadata from this computer.
- If live mode returns no networks, make sure Wi-Fi is enabled and the computer can see wireless networks.
- The dashboard is bound to `127.0.0.1`, so it is intended for use on the same computer.

## What the command does
The live route runs this read-only Windows command:

```bat
netsh wlan show networks mode=bssid
```

It does not connect to networks, collect passwords, capture traffic, inject packets, or attempt access.

## Troubleshooting
- **`py` is not recognized:** install Python from python.org and enable “Add Python to PATH”, then reopen the terminal.
- **`No module named flask`:** activate `.venv` and run `python -m pip install Flask`.
- **`Address already in use`:** close another app using port 5000 or change the port at the bottom of `app.py`.
- **Live scan error:** try `netsh wlan show networks mode=bssid` directly in Command Prompt. Demo mode should still work.

## Safety and classroom use
Only scan wireless environments you own or have explicit permission to assess. The live feature displays publicly broadcast network metadata available to the local Windows Wi-Fi interface; it does not assess whether a network is actually secure.
