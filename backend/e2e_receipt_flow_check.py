import json
import os
import time
import urllib.parse
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:5000/api"
USER_EMAIL = "aarya.patil@thane.in"
USER_PASSWORD = "Citizen@123"


def http_json(method, url, payload=None, headers=None):
    data = None
    req_headers = headers.copy() if headers else {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8") if exc.fp else "{}"
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"error": body or str(exc)}
        return exc.code, parsed


def http_form(method, url, payload, headers=None):
    encoded = urllib.parse.urlencode(payload).encode("utf-8")
    req_headers = {"Content-Type": "application/x-www-form-urlencoded"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=encoded, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8") if exc.fp else "{}"
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"error": body or str(exc)}
        return exc.code, parsed


def http_download(url, headers=None):
    req_headers = headers.copy() if headers else {}
    req = urllib.request.Request(url, headers=req_headers, method="GET")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status, resp.read(), dict(resp.headers)


def main():
    ts = int(time.time())

    login_status, login_data = http_json(
        "POST",
        f"{BASE_URL}/auth/login",
        {"email": USER_EMAIL, "password": USER_PASSWORD},
    )
    token = login_data["token"]

    issue_payload = {
        "title": f"E2E receipt validation issue {ts}",
        "description": "Automated end-to-end validation for receipt generation and token flow.",
        "category": "other",
        "severity": "low",
        "latitude": "19.2283",
        "longitude": "72.9881",
        "address": "Naupada, Thane",
    }
    create_status, create_data = http_form(
        "POST",
        f"{BASE_URL}/issues",
        issue_payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    if create_status == 201:
        issue_id = create_data["id"]
        issue_token = create_data.get("issue_token", "")
    elif create_status == 409 and create_data.get("existing_id"):
        issue_id = create_data["existing_id"]
        _, existing_issue = http_json(
            "GET",
            f"{BASE_URL}/issues/{issue_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        issue_token = existing_issue.get("issue_token", "")
    else:
        print("CREATE_STATUS", create_status)
        print("CREATE_ERROR", create_data)
        raise SystemExit(1)

    receipt_status, receipt_bytes, receipt_headers = http_download(
        f"{BASE_URL}/issues/{issue_id}/receipt",
        headers={"Authorization": f"Bearer {token}"},
    )

    receipt_dir = os.path.join(os.path.dirname(__file__), "test_receipts")
    os.makedirs(receipt_dir, exist_ok=True)
    receipt_path = os.path.join(receipt_dir, f"issue-receipt-{issue_token or issue_id}.pdf")
    with open(receipt_path, "wb") as f:
        f.write(receipt_bytes)

    is_pdf = receipt_bytes.startswith(b"%PDF")

    print("LOGIN_STATUS", login_status)
    print("CREATE_STATUS", create_status)
    print("RECEIPT_STATUS", receipt_status)
    print("ISSUE_ID", issue_id)
    print("ISSUE_TOKEN", issue_token)
    print("RECEIPT_FILE", receipt_path)
    print("RECEIPT_CONTENT_TYPE", receipt_headers.get("Content-Type"))
    print("RECEIPT_IS_PDF", is_pdf)


if __name__ == "__main__":
    main()
