from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

SPREADSHEET_ID = "1BzwZJhv1WTIeknXeY_S4EEMiHwZEgMCJvNzWb9VeJjE"
RANGE_NAME = "Sheet1!A2:D"

def get_google_sheets_service():
    creds = Credentials.from_service_account_file(
        'credentials.json',
        scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    return build("sheets", "v4", credentials=creds)

def sync_to_google_sheets(leads_data):
    service = get_google_sheets_service()
    values = [[l['name'], l['phone'], l['note'], l['timestamp']] for l in leads_data]
    body = {"values": values}
    service.spreadsheets().values().append(
        spreadsheetId=SPREADSHEET_ID,
        range=RANGE_NAME,
        valueInputOption="RAW",
        body=body
    ).execute()
