# Split Bill Demo

This repository contains a minimal web-based application for splitting a bill among multiple people.

## Features

* Upload a bill image (OCR parsing is stubbed with example items).
* Enter participant names.
* Assign each item to one or more people with custom share values.
* Optionally split the total evenly between everyone.

## Usage

Run the server with Python 3:

```bash
python3 splitbill_server.py
```

Then open `http://localhost:8000` in your browser and follow the instructions.

The OCR step uses a placeholder implementation that returns static items because OCR tools are not installed in this environment.
