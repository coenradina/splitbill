import http.server
import socketserver
import cgi
import json
import html

PORT = 8000

# Stub OCR parser

def parse_bill_image(file_data):
    """Return a list of items with quantity and price.
    This is a placeholder implementation that returns static items."""
    return [
        {"name": "Burger", "qty": 2, "price": 5.0},
        {"name": "Fries", "qty": 1, "price": 3.0},
        {"name": "Soda", "qty": 3, "price": 2.0},
    ]

INDEX_PAGE = """
<!doctype html>
<html>
<head><title>Split Bill</title></head>
<body>
<h1>Upload Bill</h1>
<form action="/parse" method="post" enctype="multipart/form-data">
<p>Bill Image: <input type="file" name="bill"></p>
<p>Names (comma separated): <input type="text" name="names"></p>
<p><input type="submit" value="Continue"></p>
</form>
</body>
</html>
"""


def generate_assign_form(items, names):
    items_json = html.escape(json.dumps(items))
    names_json = html.escape(json.dumps(names))
    out = [
        "<!doctype html>",
        "<html>",
        "<head><title>Assign Items</title></head>",
        "<body>",
        "<h1>Assign Items</h1>",
        f"<form action='/result' method='post'>",
        f"<input type='hidden' name='items_json' value='{items_json}'>",
        f"<input type='hidden' name='names_json' value='{names_json}'>",
        "<table border='1'>",
        "<tr><th>Item</th><th>Qty</th><th>Price</th>" + ''.join(f"<th>{html.escape(n)} share</th>" for n in names) + "</tr>",
    ]
    for i, item in enumerate(items):
        row = [f"<tr><td>{html.escape(item['name'])}</td>",
               f"<td>{item['qty']}</td>",
               f"<td>{item['price']}</td>"]
        for j in range(len(names)):
            row.append(f"<td><input name='share_{i}_{j}' size='5'></td>")
        row.append("</tr>")
        out.append(''.join(row))
    out.extend([
        "</table>",
        "<p><label><input type='checkbox' name='even_split'> Even split total</label></p>",
        "<p><input type='submit' value='Calculate'></p>",
        "</form>",
        "</body></html>"
    ])
    return '\n'.join(out)


def calculate_results(items, names, shares, even_split=False):
    totals = {name: 0.0 for name in names}
    if even_split:
        total = sum(it['qty'] * it['price'] for it in items)
        split = total / len(names)
        for name in names:
            totals[name] = split
        return totals
    for i, item in enumerate(items):
        item_total = item['qty'] * item['price']
        for j, name in enumerate(names):
            share = float(shares.get(f'share_{i}_{j}', 0) or 0)
            totals[name] += share * item_total
    return totals

RESULT_TEMPLATE = """
<!doctype html>
<html>
<head><title>Result</title></head>
<body>
<h1>Results</h1>
<table border='1'>
<tr><th>Name</th><th>Amount</th></tr>
{rows}
</table>
</body>
</html>
"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(INDEX_PAGE.encode())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/parse':
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers,
                                    environ={'REQUEST_METHOD': 'POST',
                                             'CONTENT_TYPE': self.headers['Content-Type']})
            names_raw = form.getvalue('names', '')
            names = [n.strip() for n in names_raw.split(',') if n.strip()]
            file_item = form['bill'] if 'bill' in form else None
            file_data = file_item.file.read() if file_item and file_item.file else None
            items = parse_bill_image(file_data)
            page = generate_assign_form(items, names)
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(page.encode())
        elif self.path == '/result':
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers,
                                    environ={'REQUEST_METHOD': 'POST',
                                             'CONTENT_TYPE': self.headers['Content-Type']})
            items = json.loads(form.getvalue('items_json'))
            names = json.loads(form.getvalue('names_json'))
            even_split = form.getvalue('even_split') == 'on'
            shares = {k: form.getvalue(k) for k in form.keys() if k.startswith('share_')}
            totals = calculate_results(items, names, shares, even_split)
            rows = ''.join(f"<tr><td>{html.escape(name)}</td><td>{totals[name]:.2f}</td></tr>" for name in names)
            page = RESULT_TEMPLATE.format(rows=rows)
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(page.encode())
        else:
            self.send_error(404)


def run(server_class=http.server.HTTPServer, handler_class=Handler):
    with server_class(('', PORT), handler_class) as httpd:
        print(f"Serving on port {PORT}...")
        httpd.serve_forever()


if __name__ == '__main__':
    run()
